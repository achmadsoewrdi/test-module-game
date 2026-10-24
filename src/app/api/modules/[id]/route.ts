import { NextResponse } from "next/server";
import { getModuleById } from "@/lib/services/module-service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const moduleItem = await getModuleById(id);

    if (!moduleItem) {
      return NextResponse.json(
        { success: false, error: "Modul tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: moduleItem });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
