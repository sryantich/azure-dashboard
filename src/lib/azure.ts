import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decryptCredentials, type AzureCredentials } from "@/lib/crypto";
import { ClientSecretCredential } from "@azure/identity";

/**
 * Retrieves the first verified Azure connection for the authenticated user,
 * decrypts credentials, and returns a ClientSecretCredential + subscriptionId.
 *
 * Returns null if no authenticated user or no verified Azure connection.
 */
export async function getAzureCredential(): Promise<{
  credential: ClientSecretCredential;
  subscriptionId: string;
  connectionId: string;
} | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  // Find the first verified Azure connection for this user
  const connection = await prisma.cloudConnection.findFirst({
    where: {
      userId: session.user.id,
      provider: "azure",
      verified: true,
    },
    orderBy: { lastUsedAt: "desc" },
  });

  if (!connection) return null;

  try {
    const creds = decryptCredentials<AzureCredentials>({
      encrypted: connection.encryptedCredentials,
      iv: connection.credentialsIv,
      tag: connection.credentialsTag,
    });

    const credential = new ClientSecretCredential(
      creds.tenantId,
      creds.clientId,
      creds.clientSecret
    );

    return {
      credential,
      subscriptionId: creds.subscriptionId,
      connectionId: connection.id,
    };
  } catch {
    return null;
  }
}

/**
 * Updates lastUsedAt on a connection after a successful API call.
 */
export async function touchConnection(connectionId: string) {
  await prisma.cloudConnection.update({
    where: { id: connectionId },
    data: { lastUsedAt: new Date() },
  });
}
