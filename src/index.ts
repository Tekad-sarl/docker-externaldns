import "dotenv/config";
import Docker, { ContainerInspectInfo, DockerOptions } from "dockerode";
import { DnsProvider } from "./@types";
import { DnsProviderFactory } from "./providers";

// Configuration Docker
const dockerOptions: DockerOptions = { socketPath: "/var/run/docker.sock" };
const docker = new Docker(dockerOptions);

// Configuration des providers DNS
const DNS_PROVIDER_TYPE = process.env.DNS_PROVIDER_TYPE || "infomaniak";
const TARGET_HOST = process.env.TARGET_HOST;
const DOCKER_LABEL = process.env.DOCKER_LABEL || "external.dns";

// Validation de configuration
if (!TARGET_HOST) {
  console.error("TARGET_HOST environment variable is required.");
  process.exit(1);
}

// Création du provider DNS approprié
let dnsProvider: DnsProvider;
try {
  dnsProvider = DnsProviderFactory.createProvider(DNS_PROVIDER_TYPE, {
    apiKey: process.env.INFOMANIAK_API_KEY,
    zone: process.env.INFOMANIAK_ZONE,
  });
} catch (error: any) {
  console.error(`Failed to initialize DNS provider: ${error.message}`);
  process.exit(1);
}

/**
 * Traite les labels Docker et gère les enregistrements DNS correspondants
 */
async function processExternalDNS(
  label: string,
  action: string
): Promise<void> {
  if (action === "start") {
    await dnsProvider.addRecord(label, TARGET_HOST!, 3600);
  } else if (action === "destroy") {
    await dnsProvider.deleteRecord(label);
  }
}

/**
 * Traite un événement Docker.
 */
async function handleDockerEvent(event: any): Promise<void> {
  if (event.Action === "start" || event.Action === "destroy") {
    console.log("Action:" + event.Action + " for container " + event.id);
    try {
      if (Object.keys(event.Actor.Attributes).includes(DOCKER_LABEL)) {
        const label = event.Actor.Attributes[DOCKER_LABEL];
        console.log(
          `Container ${event.id} (${event.Action}) with external.dns "${label}" label detected.`
        );
        await processExternalDNS(label, event.Action);
      }
    } catch (err: any) {
      console.error("Error processing Docker event:", err.message);
    }
  }
}

// Connexion au flux d'événements Docker
docker.getEvents({}, (err, stream) => {
  if (err) {
    console.error("Error connecting to Docker events:", err);
    return;
  }

  if (!stream) {
    console.error("No stream received from Docker events.");
    return;
  }

  console.log("Listening for Docker events...");

  stream.on("data", (chunk: Buffer) => {
    try {
      const events = chunk.toString("utf8").trim().split("\n");
      events.forEach((eventStr) => {
        if (eventStr) {
          const event = JSON.parse(eventStr);
          // Traite l'événement Docker
          handleDockerEvent(event);
        }
      });
    } catch (error: any) {
      console.error("Error parsing event data:", error.message);
    }
  });
});
