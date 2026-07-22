import {
  defaultProfile,
  getSavedProfile,
  type SavedProfile,
} from "../_lib/profile-store";

type JobRecommendation = {
  company: string;
  role: string;
  fitScore: number;
  why: string;
  matchingSignals: string[];
  portfolioFocus: string;
  firstAction: string;
};

type RecommendationResult = {
  profileSummary: string;
  jobs: JobRecommendation[];
};

function includesAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

function buildRecommendations(profile: SavedProfile): RecommendationResult {
  const profileText = [
    profile.headline,
    profile.targetRoles,
    profile.preferences,
    profile.resumeText,
    profile.portfolioText,
  ].join(" ");
  const isBrand = includesAny(profileText, ["브랜드", "BX", "아이덴티티"]);
  const isProduct = includesAny(profileText, ["UI", "UX", "프로덕트", "앱"]);
  const isRetail = includesAny(profileText, ["리테일", "고객 접점", "오프라인"]);

  return {
    profileSummary: `${profile.name || "지원자"}님의 프로필은 ${profile.career} 경력의 ${profile.field} 기반 지원자로, ${profile.targetRoles || "브랜드·프로덕트 직무"} 방향에 맞춰 정리했습니다.`,
    jobs: [
      {
        company: "Mori Labs",
        role: isBrand ? "브랜드 경험 디자이너" : "콘텐츠 경험 디자이너",
        fitScore: isBrand ? 86 : 78,
        why: "브랜드 방향성을 실제 고객 접점과 산출물로 확장한 사례를 보여주기 좋은 공고 유형입니다.",
        matchingSignals: [
          "브랜드 시스템",
          isRetail ? "리테일 접점" : "고객 경험",
          "포트폴리오 서사",
        ],
        portfolioFocus:
          "첫 프로젝트에 브랜드 방향, 본인 역할, 실행 결과를 한 화면에 묶어 보여주세요.",
        firstAction: "Mori Stay 또는 가장 브랜드성이 강한 프로젝트를 첫 번째로 배치하세요.",
      },
      {
        company: "Lento Studio",
        role: isProduct ? "프로덕트 디자이너" : "서비스 경험 디자이너",
        fitScore: isProduct ? 82 : 74,
        why: "사용자 흐름과 화면 설계 근거를 정리하면 서비스/프로덕트 직무로 확장하기 좋습니다.",
        matchingSignals: ["사용자 흐름", "문제 정의", "협업 과정"],
        portfolioFocus:
          "완성 화면보다 문제 정의, 구조 선택 이유, 개선 전후를 먼저 보여주세요.",
        firstAction: "UI/UX 프로젝트에 의사결정 근거와 실험 과정을 추가하세요.",
      },
      {
        company: "Onda Commerce",
        role: isRetail ? "리테일 BX 디자이너" : "브랜드 콘텐츠 디자이너",
        fitScore: isRetail ? 80 : 72,
        why: "소비자 브랜드와 운영 접점이 만나는 공고에 맞춰 경험 설계 역량을 보여줄 수 있습니다.",
        matchingSignals: ["소비자 브랜드", "운영 이해", "제작물 확장"],
        portfolioFocus:
          "패키지, 매장, 디지털 접점이 하나의 브랜드 경험으로 이어지는 장면을 강조하세요.",
        firstAction: "각 프로젝트 끝에 공고 요구와 연결되는 태그를 3개씩 붙여보세요.",
      },
    ],
  };
}

export async function POST() {
  let profile = defaultProfile;

  try {
    profile = await getSavedProfile();
  } catch {
    profile = defaultProfile;
  }

  return Response.json({
    recommendations: buildRecommendations(profile),
    mode: "sample",
  });
}
