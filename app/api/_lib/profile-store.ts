export type SavedProfile = {
  id: string;
  name: string;
  headline: string;
  field: string;
  career: string;
  targetRoles: string;
  resumeText: string;
  portfolioText: string;
  resumeFileName: string;
  portfolioFileName: string;
  preferences: string;
  updatedAt: string;
};

const profileId = "default";

type RuntimeEnv = {
  DB?: D1Database;
};

export const defaultProfile: SavedProfile = {
  id: profileId,
  name: "지원자",
  headline: "브랜드 경험과 고객 접점을 연결하는 디자이너",
  field: "디자인",
  career: "1~3년",
  targetRoles: "브랜드 경험 디자이너, BX 디자이너, 프로덕트 디자이너",
  resumeText:
    "브랜드 아이덴티티, 패키지, 리테일 고객 접점 프로젝트를 경험했습니다. 팀 프로젝트에서 리서치, 방향성 정의, 시각 시스템 제작을 담당했습니다.",
  portfolioText:
    "Mori Stay Brand System, Retail Order UI, Local Cafe Rebrand 프로젝트가 있습니다. 브랜드 시스템을 패키지와 디지털 접점까지 확장한 사례를 중심으로 구성했습니다.",
  resumeFileName: "",
  portfolioFileName: "foliofit-portfolio.pdf",
  preferences: "소비자 브랜드, 리테일, 라이프스타일, 초기 브랜드 시스템 구축",
  updatedAt: "",
};

async function runtimeEnv(): Promise<RuntimeEnv> {
  try {
    const workers = await import("cloudflare:workers");
    return workers.env as RuntimeEnv;
  } catch {
    return {};
  }
}

async function db() {
  const env = await runtimeEnv();
  if (!env.DB) {
    throw new Error("프로필 저장소가 아직 연결되지 않았습니다.");
  }

  return env.DB;
}

function clean(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 6000) : "";
}

export async function ensureProfileTable() {
  const d1 = await db();
  await d1.batch([
    d1.prepare(
      `CREATE TABLE IF NOT EXISTS profiles (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL DEFAULT '지원자',
        headline TEXT NOT NULL DEFAULT '',
        field TEXT NOT NULL DEFAULT '디자인',
        career TEXT NOT NULL DEFAULT '1~3년',
        target_roles TEXT NOT NULL DEFAULT '',
        resume_text TEXT NOT NULL DEFAULT '',
        portfolio_text TEXT NOT NULL DEFAULT '',
        resume_file_name TEXT NOT NULL DEFAULT '',
        portfolio_file_name TEXT NOT NULL DEFAULT '',
        preferences TEXT NOT NULL DEFAULT '',
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
    ),
  ]);
}

function rowToProfile(row: Record<string, unknown> | null): SavedProfile {
  if (!row) return defaultProfile;

  return {
    id: String(row.id ?? profileId),
    name: String(row.name ?? defaultProfile.name),
    headline: String(row.headline ?? defaultProfile.headline),
    field: String(row.field ?? defaultProfile.field),
    career: String(row.career ?? defaultProfile.career),
    targetRoles: String(row.target_roles ?? defaultProfile.targetRoles),
    resumeText: String(row.resume_text ?? defaultProfile.resumeText),
    portfolioText: String(row.portfolio_text ?? defaultProfile.portfolioText),
    resumeFileName: String(row.resume_file_name ?? defaultProfile.resumeFileName),
    portfolioFileName: String(
      row.portfolio_file_name ?? defaultProfile.portfolioFileName,
    ),
    preferences: String(row.preferences ?? defaultProfile.preferences),
    updatedAt: String(row.updated_at ?? ""),
  };
}

export async function getSavedProfile() {
  await ensureProfileTable();
  const d1 = await db();
  const row = await d1
    .prepare("SELECT * FROM profiles WHERE id = ?")
    .bind(profileId)
    .first<Record<string, unknown>>();
  return rowToProfile(row);
}

export async function saveProfile(payload: Partial<SavedProfile>) {
  await ensureProfileTable();
  const nextProfile = {
    ...defaultProfile,
    id: profileId,
    name: clean(payload.name) || defaultProfile.name,
    headline: clean(payload.headline),
    field: clean(payload.field) || defaultProfile.field,
    career: clean(payload.career) || defaultProfile.career,
    targetRoles: clean(payload.targetRoles),
    resumeText: clean(payload.resumeText),
    portfolioText: clean(payload.portfolioText),
    resumeFileName: clean(payload.resumeFileName),
    portfolioFileName: clean(payload.portfolioFileName),
    preferences: clean(payload.preferences),
  };

  const d1 = await db();
  await d1
    .prepare(
      `INSERT INTO profiles (
        id,
        name,
        headline,
        field,
        career,
        target_roles,
        resume_text,
        portfolio_text,
        resume_file_name,
        portfolio_file_name,
        preferences,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        headline = excluded.headline,
        field = excluded.field,
        career = excluded.career,
        target_roles = excluded.target_roles,
        resume_text = excluded.resume_text,
        portfolio_text = excluded.portfolio_text,
        resume_file_name = excluded.resume_file_name,
        portfolio_file_name = excluded.portfolio_file_name,
        preferences = excluded.preferences,
        updated_at = CURRENT_TIMESTAMP`,
    )
    .bind(
      nextProfile.id,
      nextProfile.name,
      nextProfile.headline,
      nextProfile.field,
      nextProfile.career,
      nextProfile.targetRoles,
      nextProfile.resumeText,
      nextProfile.portfolioText,
      nextProfile.resumeFileName,
      nextProfile.portfolioFileName,
      nextProfile.preferences,
    )
    .run();

  return getSavedProfile();
}
