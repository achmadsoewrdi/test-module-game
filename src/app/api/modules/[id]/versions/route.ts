import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { saveNewModuleVersion } from "@/lib/services/module-service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { manifest, sourceHtml, sourceCss, sourceJs } = body;

    const savedVersion = await saveNewModuleVersion({
      moduleId: id,
      manifest,
      sourceHtml: sourceHtml ?? "",
      sourceCss: sourceCss ?? "",
      sourceJs: sourceJs ?? "",
      userId: session.user.id,
    });

    return NextResponse.json({ success: true, data: savedVersion });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
