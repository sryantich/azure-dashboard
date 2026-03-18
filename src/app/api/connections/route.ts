import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  encryptCredentials,
  type AzureCredentials,
  type AwsCredentials,
  type GcpCredentials,
} from "@/lib/crypto";

type Provider = "azure" | "aws" | "gcp";

// ─── GET /api/connections — list user's cloud connections ───
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const connections = await prisma.cloudConnection.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      provider: true,
      name: true,
      verified: true,
      lastUsedAt: true,
      createdAt: true,
      updatedAt: true,
      // NEVER return encrypted credentials to the client
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(connections);
}

// ─── Validation helpers ─────────────────────────────────────

function validateAzure(creds: Record<string, unknown>): AzureCredentials | null {
  const { tenantId, clientId, clientSecret, subscriptionId } = creds;
  if (
    typeof tenantId === "string" && tenantId.length > 0 &&
    typeof clientId === "string" && clientId.length > 0 &&
    typeof clientSecret === "string" && clientSecret.length > 0 &&
    typeof subscriptionId === "string" && subscriptionId.length > 0
  ) {
    return { tenantId, clientId, clientSecret, subscriptionId };
  }
  return null;
}

function validateAws(creds: Record<string, unknown>): AwsCredentials | null {
  const { accessKeyId, secretAccessKey, region } = creds;
  if (
    typeof accessKeyId === "string" && accessKeyId.length > 0 &&
    typeof secretAccessKey === "string" && secretAccessKey.length > 0 &&
    typeof region === "string" && region.length > 0
  ) {
    return { accessKeyId, secretAccessKey, region };
  }
  return null;
}

function validateGcp(creds: Record<string, unknown>): GcpCredentials | null {
  const { projectId, serviceAccountKey } = creds;
  if (
    typeof projectId === "string" && projectId.length > 0 &&
    typeof serviceAccountKey === "string" && serviceAccountKey.length > 0
  ) {
    return { projectId, serviceAccountKey };
  }
  return null;
}

function validateCredentials(provider: Provider, creds: Record<string, unknown>) {
  switch (provider) {
    case "azure":
      return validateAzure(creds);
    case "aws":
      return validateAws(creds);
    case "gcp":
      return validateGcp(creds);
    default:
      return null;
  }
}

// ─── POST /api/connections — create a new cloud connection ──
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { provider, name, credentials } = body as {
    provider?: string;
    name?: string;
    credentials?: Record<string, unknown>;
  };

  // Validate provider
  if (!provider || !["azure", "aws", "gcp"].includes(provider)) {
    return NextResponse.json(
      { error: 'Invalid provider. Must be "azure", "aws", or "gcp".' },
      { status: 400 }
    );
  }

  // Validate name
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json(
      { error: "Connection name is required." },
      { status: 400 }
    );
  }

  // Validate credentials
  if (!credentials || typeof credentials !== "object") {
    return NextResponse.json(
      { error: "Credentials object is required." },
      { status: 400 }
    );
  }

  const validatedCreds = validateCredentials(provider as Provider, credentials);
  if (!validatedCreds) {
    return NextResponse.json(
      { error: `Invalid credentials for ${provider}. Check all required fields.` },
      { status: 400 }
    );
  }

  // Check for duplicate name per provider
  const existing = await prisma.cloudConnection.findUnique({
    where: {
      userId_provider_name: {
        userId: session.user.id,
        provider,
        name: name.trim(),
      },
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: `A ${provider} connection named "${name.trim()}" already exists.` },
      { status: 409 }
    );
  }

  // Encrypt and store
  const encrypted = encryptCredentials(validatedCreds);

  const connection = await prisma.cloudConnection.create({
    data: {
      userId: session.user.id,
      provider,
      name: name.trim(),
      encryptedCredentials: encrypted.encrypted,
      credentialsIv: encrypted.iv,
      credentialsTag: encrypted.tag,
    },
    select: {
      id: true,
      provider: true,
      name: true,
      verified: true,
      createdAt: true,
    },
  });

  return NextResponse.json(connection, { status: 201 });
}

// ─── PUT /api/connections — update a connection ─────────────
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { id, name, credentials } = body as {
    id?: string;
    name?: string;
    credentials?: Record<string, unknown>;
  };

  if (!id) {
    return NextResponse.json({ error: "Connection id is required." }, { status: 400 });
  }

  // Verify ownership
  const existing = await prisma.cloudConnection.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Connection not found." }, { status: 404 });
  }

  // Build update data
  const updateData: Record<string, unknown> = {};

  if (name && typeof name === "string" && name.trim().length > 0) {
    updateData.name = name.trim();
  }

  if (credentials && typeof credentials === "object") {
    const validatedCreds = validateCredentials(
      existing.provider as Provider,
      credentials
    );
    if (!validatedCreds) {
      return NextResponse.json(
        { error: `Invalid credentials for ${existing.provider}.` },
        { status: 400 }
      );
    }
    const encrypted = encryptCredentials(validatedCreds);
    updateData.encryptedCredentials = encrypted.encrypted;
    updateData.credentialsIv = encrypted.iv;
    updateData.credentialsTag = encrypted.tag;
    updateData.verified = false; // Reset verification when creds change
  }

  const updated = await prisma.cloudConnection.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      provider: true,
      name: true,
      verified: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(updated);
}

// ─── DELETE /api/connections — delete a connection ──────────
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Connection id is required." }, { status: 400 });
  }

  // Verify ownership
  const existing = await prisma.cloudConnection.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Connection not found." }, { status: 404 });
  }

  await prisma.cloudConnection.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
