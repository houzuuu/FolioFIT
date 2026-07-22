import {
  defaultProfile,
  getSavedProfile,
  saveProfile,
} from "../_lib/profile-store";

export async function GET() {
  try {
    const profile = await getSavedProfile();
    return Response.json({ profile });
  } catch (error) {
    return Response.json({
      profile: defaultProfile,
      warning:
        error instanceof Error
          ? error.message
          : "프로필 저장소를 읽지 못했습니다.",
    });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const profile = await saveProfile(payload);
    return Response.json({ profile });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "프로필을 저장하지 못했습니다.",
      },
      { status: 500 },
    );
  }
}
