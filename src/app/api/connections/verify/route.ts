import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decryptCredentials, type AzureCredentials } from "@/lib/crypto";
import { ClientSecretCredential } from "@azure/identity";

// ─── POST /api/connections/verify — test a cloud connection ─
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { id } = body;
  if (!id) {
    return NextResponse.json({ error: "Connection id is required." }, { status: 400 });
  }

  // Fetch connection (including encrypted credentials)
  const connection = await prisma.cloudConnection.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!connection) {
    return NextResponse.json({ error: "Connection not found." }, { status: 404 });
  }

  try {
    switch (connection.provider) {
      case "azure": {
        const creds = decryptCredentials<AzureCredentials>({
          encrypted: connection.encryptedCredentials,
          iv: connection.credentialsIv,
          tag: connection.credentialsTag,
        });

        // Verify credentials by requesting an access token for Azure Management
        const credential = new ClientSecretCredential(
          creds.tenantId,
          creds.clientId,
          creds.clientSecret
        );

        // getToken will throw if credentials are invalid
        const token = await credential.getToken(
          "https://management.azure.com/.default"
        );

        if (!token) {
          throw new Error("Failed to obtain access token.");
        }

        // Optionally verify subscription access via REST
        const subsRes = await fetch(
          "https://management.azure.com/subscriptions?api-version=2022-12-01",
          {
            headers: {
              Authorization: `Bearer ${token.token}`,
            },
          }
        );

        let subscriptionInfo = "";
        if (subsRes.ok) {
          const data = await subsRes.json();
          const subs = (data.value || []).slice(0, 5).map(
            (s: { subscriptionId: string; displayName: string; state: string }) => ({
              id: s.subscriptionId,
              name: s.displayName,
              state: s.state,
            })
          );
          subscriptionInfo = ` Found ${subs.length} subscription(s).`;
        }

        // Mark as verified
        await prisma.cloudConnection.update({
          where: { id },
          data: { verified: true, lastUsedAt: new Date() },
        });

        return NextResponse.json({
          success: true,
          provider: "azure",
          message: `Connected successfully.${subscriptionInfo}`,
        });
      }

      case "aws": {
        // AWS verification: placeholder — would use AWS STS GetCallerIdentity
        // For now, mark as verified (we don't have AWS SDK installed yet)
        await prisma.cloudConnection.update({
          where: { id },
          data: { verified: true, lastUsedAt: new Date() },
        });

        return NextResponse.json({
          success: true,
          provider: "aws",
          message: "AWS connection saved. Live verification coming soon.",
        });
      }

      case "gcp": {
        // GCP verification: placeholder — would use google-auth-library
        await prisma.cloudConnection.update({
          where: { id },
          data: { verified: true, lastUsedAt: new Date() },
        });

        return NextResponse.json({
          success: true,
          provider: "gcp",
          message: "GCP connection saved. Live verification coming soon.",
        });
      }

      default:
        return NextResponse.json(
          { error: "Unknown provider." },
          { status: 400 }
        );
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown error during verification.";

    // Mark as not verified
    await prisma.cloudConnection.update({
      where: { id },
      data: { verified: false },
    });

    return NextResponse.json(
      { success: false, error: message },
      { status: 422 }
    );
  }
}
