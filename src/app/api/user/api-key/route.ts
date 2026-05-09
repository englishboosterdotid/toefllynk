import { NextResponse } from "next/server";
import { requireUser } from "@/lib/requireUser";
import {
  createApiKey,
  getApiKey,
  regenerateApiKey,
  updateApiKey,
  deleteApiKey,
  API_PERMISSIONS,
  type ApiPermission,
} from "@/lib/services/apiKeyService";

export async function GET() {
  try {
    const user = await requireUser();

    const apiKey = await getApiKey(user.id);

    if (!apiKey) {
      return NextResponse.json({ success: true, apiKey: null, hasKey: false });
    }

    return NextResponse.json({
      success: true,
      apiKey: {
        ...apiKey,
        // Don't expose the full key, just the prefix
        keyPrefix: apiKey.keyPrefix,
      },
      hasKey: true,
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json();

    const { name, permissions, regenerate } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, message: "Nama API key wajib diisi" },
        { status: 400 }
      );
    }

    if (!permissions || !Array.isArray(permissions) || permissions.length === 0) {
      return NextResponse.json(
        { success: false, message: "Minimal satu permission harus dipilih" },
        { status: 400 }
      );
    }

    // Validate permissions
    const validPermissions = Object.values(API_PERMISSIONS);
    const invalidPermissions = permissions.filter((p: string) => !validPermissions.includes(p as ApiPermission));
    if (invalidPermissions.length > 0) {
      return NextResponse.json(
        { success: false, message: `Permission tidak valid: ${invalidPermissions.join(", ")}` },
        { status: 400 }
      );
    }

    let result;
    if (regenerate) {
      result = await regenerateApiKey(user.id, name, permissions as ApiPermission[]);
    } else {
      result = await createApiKey(user.id, {
        name,
        permissions: permissions as ApiPermission[],
      });
    }

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      apiKey: result.apiKey,
      plainKey: result.plainKey,
      message: "API key berhasil dibuat. Simpan plainKey ini karena tidak akan ditampilkan lagi.",
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    if (error.message.includes("PRO")) {
      return NextResponse.json({ success: false, message: error.message }, { status: 403 });
    }
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json();

    const { name, permissions, isActive, expiresAt } = body;

    // Validate permissions if provided
    if (permissions) {
      if (!Array.isArray(permissions) || permissions.length === 0) {
        return NextResponse.json(
          { success: false, message: "Minimal satu permission harus dipilih" },
          { status: 400 }
        );
      }

      const validPermissions = Object.values(API_PERMISSIONS);
      const invalidPermissions = permissions.filter((p: string) => !validPermissions.includes(p as ApiPermission));
      if (invalidPermissions.length > 0) {
        return NextResponse.json(
          { success: false, message: `Permission tidak valid: ${invalidPermissions.join(", ")}` },
          { status: 400 }
        );
      }
    }

    const result = await updateApiKey(user.id, {
      name,
      permissions: permissions as ApiPermission[] | undefined,
      isActive,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, apiKey: result.apiKey });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}

export async function DELETE() {
  try {
    const user = await requireUser();

    const result = await deleteApiKey(user.id);

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "API key berhasil dihapus" });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}