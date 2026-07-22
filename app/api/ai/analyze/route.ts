type JobAnalysis = {
  summary: string;
  companyInfo: string;
  targetRole: string;
  mustHave: string[];
  preferredSignals: string[];
  unclear: string[];
  portfolioAdvice: string;
  confidence: string;
  sourceNotes: string[];
};

function trim(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 8000) : "";
}

function buildAnalysis({
  companyName,
  jobTitle,
  sourceType,
  sourceName,
  jobPostText,
}: {
  companyName: string;
  jobTitle: string;
  sourceType: string;
  sourceName: string;
  jobPostText: string;
}): JobAnalysis {
  const company = companyName || "입력한 기업";
  const role = jobTitle || "입력한 직무";
  const hasPackage = jobPostText.includes("패키지");
  const hasRetail =
    jobPostText.includes("리테일") || jobPostText.includes("고객 접점");

  return {
    summary: `${company}의 ${role} 공고는 브랜드 방향을 결과물로 확장하고, 본인의 역할과 실행 근거를 빠르게 보여주는 포트폴리오에 잘 맞는 것으로 보입니다.`,
    companyInfo: `${company}는 공고 자료 기준으로 브랜드 경험, 고객 접점, 실행 결과를 함께 보는 조직으로 정리했습니다.`,
    targetRole: `${role}. 문제를 해석하고 시각 시스템, 실행 산출물, 협업 과정을 연결해 보여주는 사람이 적합해 보입니다.`,
    mustHave: [
      "브랜드 방향성 해석",
      hasPackage ? "패키지 또는 제작물 실행 경험" : "완성 산출물 제작 경험",
      "프로젝트 안에서의 개인 기여도 설명",
    ],
    preferredSignals: [
      hasRetail ? "리테일·고객 접점 경험" : "사용자 경험 관점",
      "협업 과정 정리",
      "결과물 전후 맥락 설명",
    ],
    unclear: [
      "실제 팀 규모",
      "의사결정 권한 범위",
      "정량 성과와 공개 가능한 제작 조건",
    ],
    portfolioAdvice:
      "첫 프로젝트에는 공고 요구와 가장 가까운 사례를 배치하고, 각 프로젝트 첫 화면에 역할·핵심 결정·근거 페이지를 함께 적어주세요.",
    confidence: "중간",
    sourceNotes: [
      `${sourceType || "텍스트"} 입력을 기준으로 만든 분석글입니다.`,
      sourceName ? `참고 출처: ${sourceName}` : "공고 원문이 길수록 더 구체적인 문구가 만들어집니다.",
    ],
  };
}

export async function POST(request: Request) {
  const payload = (await request.json()) as Record<string, unknown>;
  const analysis = buildAnalysis({
    companyName: trim(payload.companyName),
    jobTitle: trim(payload.jobTitle),
    sourceType: trim(payload.sourceType),
    sourceName: trim(payload.sourceName),
    jobPostText: trim(payload.jobPostText),
  });

  return Response.json({
    analysis,
    mode: "sample",
  });
}
