"use client";

import { ChangeEvent, useEffect, useState } from "react";

type Role = "candidate" | "expert" | "admin";
type AppView =
  | "welcome"
  | "onboarding"
  | "home"
  | "new"
  | "progress"
  | "result"
  | "suggestions"
  | "review"
  | "admin"
  | "expert"
  | "integrated"
  | "analyses"
  | "profile";
type Field = "design" | "architecture" | "rnd" | "development";
type ResultTab =
  | "summary"
  | "requirements"
  | "projects"
  | "pages"
  | "rewrite"
  | "interview";
const jobSourceOptions = ["텍스트", "이미지", "URL", "PDF"] as const;
type JobSource = (typeof jobSourceOptions)[number];
type ReviewStatus =
  | "not_requested"
  | "requested"
  | "assigned"
  | "accepted"
  | "in_review"
  | "submitted";

type EvidenceDetail = {
  title: string;
  source: "채용공고" | "포트폴리오" | "자동 분석" | "전문가 리뷰";
  excerpt: string;
  reason: string;
  page?: string;
  project?: string;
  confidence?: string;
  nextAction?: string;
};

type JobInsight = {
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

type SavedProfile = {
  id?: string;
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
  updatedAt?: string;
};

type RecommendationResult = {
  profileSummary: string;
  jobs: Array<{
    company: string;
    role: string;
    fitScore: number;
    why: string;
    matchingSignals: string[];
    portfolioFocus: string;
    firstAction: string;
  }>;
};

const defaultProfile: SavedProfile = {
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
};

const fields: Record<
  Field,
  {
    title: string;
    subtitle: string;
    specialties: string[];
    signal: string;
  }
> = {
  design: {
    title: "디자인",
    subtitle: "BX, UI/UX, 패키지, 콘텐츠, 모션",
    specialties: [
      "brand_bx",
      "uiux_product",
      "package",
      "visual_identity",
      "content_graphic",
      "design_strategy",
      "motion_interaction",
      "spatial_retail",
    ],
    signal: "브랜드, 화면, 산출물의 실행 근거",
  },
  architecture: {
    title: "건축·공간",
    subtitle: "건축설계, 공간, BIM, 시공, 도시",
    specialties: [
      "architectural_design",
      "interior_spatial",
      "bim",
      "construction_site",
      "urban_landscape",
      "exhibition_space",
      "sustainable_design",
      "real_estate_dev",
    ],
    signal: "설계 단계와 기여 범위",
  },
  rnd: {
    title: "연구개발",
    subtitle: "바이오, 소재, 식품, 데이터, 공정",
    specialties: [
      "bio_pharma",
      "chemistry_materials",
      "food",
      "data_research",
      "hardware_iot",
      "manufacturing_process",
      "clinical_regulatory",
      "research_planning",
    ],
    signal: "문제, 방법, 재현 가능한 결과",
  },
  development: {
    title: "개발",
    subtitle: "프론트엔드, 백엔드, 앱, 데이터, 클라우드",
    specialties: [
      "frontend",
      "backend",
      "fullstack",
      "mobile_app",
      "devops_cloud",
      "data_engineering",
      "ai_engineering",
      "qa_automation",
      "security",
      "game_client",
    ],
    signal: "문제 해결, 구현 범위, 운영 근거",
  },
};

const careerLevels = ["신입·취업 준비", "1~3년", "4~7년", "8년 이상"];

const roleLabels: Record<Role, string> = {
  candidate: "지원자",
  expert: "전문가",
  admin: "운영자",
};

const reviewStatusLabels: Record<ReviewStatus, string> = {
  not_requested: "요청 전",
  requested: "요청 완료",
  assigned: "전문가 배정",
  accepted: "전문가 수락",
  in_review: "리뷰 작성 중",
  submitted: "리뷰 완료",
};

const specialtyLabels: Record<string, string> = {
  brand_bx: "브랜드·BX",
  uiux_product: "UI/UX·프로덕트",
  package: "패키지",
  visual_identity: "비주얼·아이덴티티",
  content_graphic: "콘텐츠·그래픽",
  design_strategy: "디자인 전략",
  motion_interaction: "모션·인터랙션",
  spatial_retail: "공간·리테일",
  architectural_design: "건축설계",
  interior_spatial: "인테리어·공간",
  bim: "BIM",
  construction_site: "시공·현장",
  urban_landscape: "도시·조경",
  exhibition_space: "전시·상업공간",
  sustainable_design: "친환경·지속가능",
  real_estate_dev: "부동산·개발기획",
  bio_pharma: "바이오·제약",
  chemistry_materials: "화학·소재",
  food: "식품",
  data_research: "데이터·실험분석",
  hardware_iot: "하드웨어·IoT",
  manufacturing_process: "공정·양산",
  clinical_regulatory: "임상·인허가",
  research_planning: "연구기획",
  frontend: "프론트엔드",
  backend: "백엔드",
  fullstack: "풀스택",
  mobile_app: "모바일 앱",
  devops_cloud: "DevOps·클라우드",
  data_engineering: "데이터 엔지니어링",
  ai_engineering: "AI 엔지니어링",
  qa_automation: "QA·자동화",
  security: "보안",
  game_client: "게임 클라이언트",
};

const coverageLabels: Record<string, string> = {
  Covered: "충분",
  Partial: "일부 확인",
  Missing: "부족",
  Unclear: "확인 필요",
};

const pageStatusLabels: Record<string, string> = {
  Improve: "개선",
  "Add evidence": "근거 추가",
  Keep: "유지",
  Move: "이동",
  Remove: "삭제 검토",
};

const effortLabels: Record<string, string> = {
  low: "낮은 노력",
  medium: "보통 노력",
  high: "높은 노력",
};

const dimensionLabels: Record<string, string> = {
  "Requirement Coverage": "요구사항 충족도",
  "Evidence Strength": "근거의 강도",
  "Contribution Clarity": "기여도 명확성",
  "Narrative Quality": "서사의 완성도",
  "Target & Industry Fit": "직무·산업 적합도",
};

function statusLabel(status: ReviewStatus) {
  return reviewStatusLabels[status];
}

function displaySpecialty(value: string) {
  return specialtyLabels[value] ?? value.replaceAll("_", " ");
}

const fieldKeys = Object.keys(fields) as Field[];

function fieldFromTitle(title: string): Field {
  return fieldKeys.find((item) => fields[item].title === title) ?? "design";
}

function selectedSpecialtyText(specialties: string[]) {
  return specialties.map(displaySpecialty).join(", ");
}

function selectedSpecialtyKeysFromText(text: string, field: Field) {
  return fields[field].specialties.filter((item) => {
    const label = displaySpecialty(item);
    const labelParts = label
      .split(/[·/]/)
      .map((part) => part.trim())
      .filter((part) => part.length >= 2);

    return text.includes(label) || labelParts.some((part) => text.includes(part));
  });
}

function evidenceDetail(detail: EvidenceDetail) {
  return detail;
}

const sampleAnalysis = {
  company: "Mori Labs",
  role: "브랜드 경험 디자이너",
  generatedAt: "2026.07.20",
  score: 78,
  label: "좋은 기반",
  disclaimer:
    "현재 업로드된 자료에서 확인되는 직무 적합도와 증거 전달력을 기준으로 계산했습니다. 실제 채용 결과를 예측하지 않습니다.",
  summary:
    "브랜드 시스템과 고객 접점 결과물은 강하지만 패키지 실행 과정과 개인의 의사결정 범위가 초반에 충분히 드러나지 않습니다.",
  strengths: [
    "아이덴티티를 패키지와 디지털 접점까지 확장한 경험",
    "리테일 고객 접점까지 이어지는 실행 경험",
  ],
  priorities: [
    {
      title: "Mori Stay 프로젝트를 첫 번째로 이동",
      detail: "공고의 브랜드 시스템과 패키지 요구를 동시에 증명합니다.",
      effort: "low",
      evidence: ["공고: 브랜드 아이덴티티 및 제품 패키지 디자인", "p.12"],
    },
    {
      title: "개인 기여도와 핵심 결정 추가",
      detail: "팀 결과와 개인 결정 범위를 분리해야 담당 수준이 보입니다.",
      effort: "low",
      evidence: ["p.12 Team project", "p.18 패키지 목업"],
    },
  ],
  dimensions: [
    ["Requirement Coverage", 82, "핵심 역량 대부분과 연결되는 프로젝트가 있습니다."],
    ["Evidence Strength", 76, "완성 결과는 충분하지만 일부 과정 근거가 약합니다."],
    ["Contribution Clarity", 68, "개인 역할을 더 명확히 표시해야 합니다."],
    ["Narrative Quality", 80, "브랜드 배경과 결과 연결은 이해하기 쉽습니다."],
    ["Target & Industry Fit", 84, "소비자 브랜드 경험이 지원 산업과 잘 맞습니다."],
  ],
  requirements: [
    {
      title: "브랜드 아이덴티티 개발",
      status: "Covered",
      importance: "필수",
      job: "브랜드 아이덴티티 및 비주얼 시스템 개발",
      evidence: "p.12 Mori Stay Brand System",
      action: "해당 프로젝트를 앞에 배치하세요.",
    },
    {
      title: "패키지 디자인 실무",
      status: "Partial",
      importance: "필수",
      job: "제품 패키지 디자인 및 양산 커뮤니케이션",
      evidence: "p.18 패키지 목업",
      action: "인쇄 사양 또는 제작 조율 경험을 추가하세요.",
    },
    {
      title: "리테일 경험",
      status: "Covered",
      importance: "우대",
      job: "소비자 브랜드 또는 리테일 경험 우대",
      evidence: "p.25 Retail Order UI",
      action: "고객 접점 결과를 요약 문장에 연결하세요.",
    },
  ],
  projects: [
    {
      name: "Mori Stay Brand System",
      current: 4,
      recommended: 1,
      score: 94,
      reason: "브랜딩과 패키지를 동시에 보여줍니다.",
      tags: ["브랜드 시스템", "패키지", "고객 경험"],
    },
    {
      name: "Retail Order UI",
      current: 2,
      recommended: 2,
      score: 83,
      reason: "실제 고객 접점과 운영 이해를 보여줍니다.",
      tags: ["UI/UX", "리테일", "협업"],
    },
  ],
  pages: [
    {
      page: 12,
      project: "Mori Stay Brand System",
      status: "Improve",
      title: "개인 기여도를 표시하세요",
      diagnosis:
        "결과물은 명확하지만 개인의 의사결정 범위를 판단하기 어렵습니다.",
      change: "역할, 핵심 결정, 협업 대상을 추가하세요.",
    },
    {
      page: 18,
      project: "Mori Stay Brand System",
      status: "Add evidence",
      title: "패키지 양산 근거를 보완하세요",
      diagnosis: "패키지 이미지는 있지만 제작 조건과 결과가 없습니다.",
      change: "인쇄 방식, 소재, 제작 범위 중 공개 가능한 항목을 추가하세요.",
    },
  ],
  rewrite: {
    page: 12,
    project: "Mori Stay Brand System",
    original: "도심 속 휴식을 위한 호텔 브랜드를 디자인했습니다.",
    suggested:
      "도심 체류자의 회복 경험이 예약 과정부터 객실 어메니티까지 일관되게 이어지도록 브랜드 아이덴티티와 패키지 시스템을 설계했습니다.",
    warning: "원문에 없는 수치나 성과를 추가하지 않았습니다.",
  },
  missingProof: [
    {
      requirement: "패키지 양산 및 협력사 커뮤니케이션",
      status: "Unclear",
      question: "인쇄소 또는 제작업체와 사양을 조율한 경험이 있나요?",
      proof: "인쇄 방식, 소재 선택 이유, 감리 과정",
      page: 18,
      placement: "p.18 다음 페이지",
    },
  ],
  interview: [
    {
      category: "역할 검증",
      question:
        "Mori Stay 프로젝트에서 직접 결정한 요소와 협업으로 결정된 요소를 구분해 설명해주세요.",
      why: "개인 기여도가 명확하지 않습니다.",
      framework: "목표 → 책임 범위 → 핵심 결정 → 협업 결과",
    },
    {
      category: "결과",
      question: "패키지 시스템의 완성도를 어떤 기준으로 검증했나요?",
      why: "양산과 결과 검증이 중요한 요구입니다.",
      framework: "검증 기준 → 제작 테스트 → 수정 → 결과",
    },
  ],
};

const progressStages = [
  "공고 핵심 역량 정리",
  "프로젝트 구분",
  "요구 역량과 근거 연결",
  "수정 우선순위 생성",
];

const reviewTimeline: Array<{ key: ReviewStatus; label: string }> = [
  { key: "requested", label: "요청 완료" },
  { key: "assigned", label: "전문가 매칭" },
  { key: "accepted", label: "전문가 수락" },
  { key: "in_review", label: "리뷰 작성" },
  { key: "submitted", label: "리뷰 완료" },
];

const statusOrder: ReviewStatus[] = [
  "not_requested",
  "requested",
  "assigned",
  "accepted",
  "in_review",
  "submitted",
];

function statusReached(current: ReviewStatus, target: ReviewStatus) {
  return statusOrder.indexOf(current) >= statusOrder.indexOf(target);
}

export default function Home() {
  const [view, setView] = useState<AppView>("welcome");
  const [role, setRole] = useState<Role>("candidate");
  const [field, setField] = useState<Field>("design");
  const [specialties, setSpecialties] = useState<string[]>([
    fields.design.specialties[0],
  ]);
  const [career, setCareer] = useState(careerLevels[1]);
  const [step, setStep] = useState(0);
  const [resultTab, setResultTab] = useState<ResultTab>("summary");
  const [progressIndex, setProgressIndex] = useState(0);
  const [reviewStatus, setReviewStatus] =
    useState<ReviewStatus>("not_requested");
  const [perspective, setPerspective] = useState("종합");
  const [fileName, setFileName] = useState("foliofit-portfolio.pdf");
  const [toast, setToast] = useState("");
  const [activeEvidence, setActiveEvidence] = useState<EvidenceDetail | null>(
    null,
  );
  const [conflictChecked, setConflictChecked] = useState(false);
  const [draft, setDraft] = useState({
    first: "첫 30초 안에 통합 브랜드 경험은 보이지만, 개인 역할이 늦게 드러납니다.",
    priority: "Mori Stay를 첫 프로젝트로 이동하고 p.12에 결정 범위를 추가하세요.",
    question: "패키지 제작 조건을 실제로 검증한 과정이 있었는지 확인하고 싶습니다.",
  });

  const fieldInfo = fields[field];
  const isProgressDone = progressIndex >= progressStages.length - 1;

  useEffect(() => {
    if (view !== "progress" || isProgressDone) return;
    const timer = window.setTimeout(() => {
      setProgressIndex((current) =>
        Math.min(current + 1, progressStages.length - 1),
      );
    }, 1100);

    return () => window.clearTimeout(timer);
  }, [view, progressIndex, isProgressDone]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function go(nextView: AppView) {
    setView(nextView);
    if (nextView === "progress") setProgressIndex(0);
  }

  function switchRole(nextRole: Role) {
    setRole(nextRole);
    if (nextRole === "candidate") go("home");
    if (nextRole === "expert") go("expert");
    if (nextRole === "admin") go("admin");
  }

  function selectField(nextField: Field) {
    setField(nextField);
    setSpecialties([fields[nextField].specialties[0]]);
  }

  function toggleSpecialty(nextSpecialty: string) {
    setSpecialties((current) => {
      if (current.includes(nextSpecialty)) {
        const next = current.filter((item) => item !== nextSpecialty);
        return next.length > 0 ? next : current;
      }

      return [...current, nextSpecialty];
    });
  }

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0];
    if (!nextFile) return;
    if (nextFile.type && nextFile.type !== "application/pdf") {
      setToast("PDF 파일만 업로드할 수 있습니다.");
      return;
    }
    setFileName(nextFile.name);
    setToast("포트폴리오가 분석에 연결되었습니다.");
  }

  function requestReview() {
    setReviewStatus("requested");
    setToast("전문가 리뷰 요청이 접수되었습니다.");
  }

  function assignExpert() {
    setReviewStatus("assigned");
    setToast("검증된 전문가가 배정되었습니다.");
  }

  function acceptReview() {
    if (!conflictChecked) {
      setToast("이해상충 확인을 먼저 체크해주세요.");
      return;
    }
    setReviewStatus("in_review");
    setRole("expert");
    setToast("리뷰 초안 자동 저장이 시작되었습니다.");
  }

  function submitExpertReview() {
    setReviewStatus("submitted");
    setRole("candidate");
    go("integrated");
    setToast("전문가 리뷰가 통합 결과에 반영되었습니다.");
  }

  function openEvidence(detail: EvidenceDetail) {
    setActiveEvidence(detail);
  }

  function copyEvidence(text: string) {
    void navigator.clipboard?.writeText(text);
    setToast("근거 내용을 복사했어요.");
  }

  return (
    <div className="page-backdrop">
      <div className="phone-shell">
        <header className="app-header">
          <button
            className="brand-button"
            type="button"
            onClick={() => go(view === "welcome" ? "welcome" : "home")}
            aria-label="FOLIOFIT 홈"
          >
            <span className="brand-mark" aria-hidden="true">
              <span className="brand-folio">
                <span className="brand-fit-line" />
              </span>
            </span>
            <span>
              <strong>FOLIOFIT</strong>
              <small>사용자 앱</small>
            </span>
          </button>
          <div className="role-switch" aria-label="개발용 역할 전환" hidden>
            {(["candidate", "expert", "admin"] as Role[]).map((item) => (
              <button
                key={item}
                className={role === item ? "is-active" : ""}
                type="button"
                onClick={() => switchRole(item)}
              >
                {roleLabels[item].slice(0, 2)}
              </button>
            ))}
          </div>
        </header>

        <main className="app-main">
          {view === "welcome" && (
            <WelcomeScreen
              onStart={() => go("onboarding")}
              onDemo={() => go("result")}
              onSignIn={() => {
                setToast("계정으로 이어서 시작합니다.");
                go("home");
              }}
            />
          )}

          {view === "onboarding" && (
            <OnboardingScreen
              field={field}
              fieldInfo={fieldInfo}
              specialties={specialties}
              career={career}
              onField={selectField}
              onSpecialty={toggleSpecialty}
              onCareer={setCareer}
              onNext={() => go("home")}
            />
          )}

          {view === "home" && (
            <HomeScreen
              field={field}
              fieldInfo={fieldInfo}
              onNew={() => go("new")}
              onResult={() => go("result")}
              onSuggestions={() => go("suggestions")}
            />
          )}

          {view === "new" && (
            <NewAnalysisScreen
              step={step}
              field={field}
              fieldInfo={fieldInfo}
              specialties={specialties}
              career={career}
              fileName={fileName}
              onStep={setStep}
              onField={selectField}
              onSpecialty={toggleSpecialty}
              onCareer={setCareer}
              onFile={handleFile}
              onCancel={() => go("home")}
              onStart={() => go("progress")}
              onToast={setToast}
            />
          )}

          {view === "progress" && (
            <ProgressScreen
              progressIndex={progressIndex}
              isDone={isProgressDone}
              onResult={() => go("result")}
              onHome={() => go("home")}
            />
          )}

          {view === "analyses" && (
            <AnalysesScreen
              onResult={() => go("result")}
              onNew={() => {
                setStep(0);
                go("new");
              }}
            />
          )}

          {view === "result" && (
            <ResultScreen
              tab={resultTab}
              onTab={setResultTab}
              onEvidence={openEvidence}
              onSuggestions={() => go("suggestions")}
              onNew={() => {
                setStep(0);
                go("new");
              }}
              onDelete={() => {
                setToast("분석을 숨겼습니다. 언제든 다시 열 수 있어요.");
                go("home");
              }}
            />
          )}

          {view === "suggestions" && (
            <SuggestionScreen onProfile={() => go("profile")} onNew={() => go("new")} />
          )}

          {view === "review" && (
            <ReviewRequestScreen
              perspective={perspective}
              reviewStatus={reviewStatus}
              onPerspective={setPerspective}
              onRequest={requestReview}
              onAdmin={() => {
                setRole("admin");
                go("admin");
              }}
              onResult={() => go("result")}
            />
          )}

          {view === "admin" && (
            <AdminScreen
              reviewStatus={reviewStatus}
              onEvidence={openEvidence}
              onAssign={assignExpert}
              onExpert={() => {
                setRole("expert");
                go("expert");
              }}
              onCandidate={() => {
                setRole("candidate");
                go("home");
              }}
            />
          )}

          {view === "expert" && (
            <ExpertScreen
              reviewStatus={reviewStatus}
              conflictChecked={conflictChecked}
              draft={draft}
              onConflict={setConflictChecked}
              onDraft={setDraft}
              onAccept={acceptReview}
              onDecline={() => {
                setReviewStatus("requested");
                setRole("admin");
                go("admin");
                setToast("전문가가 거절했습니다. 운영팀 재배정이 필요합니다.");
              }}
              onSubmit={submitExpertReview}
              onBack={() => {
                setRole("candidate");
                go("home");
              }}
            />
          )}

          {view === "integrated" && (
            <IntegratedScreen
              draft={draft}
              onHome={() => go("home")}
              onNew={() => {
                setStep(0);
                go("new");
              }}
              onResult={() => go("result")}
            />
          )}

          {view === "profile" && (
            <ProfileScreen
              fieldInfo={fieldInfo}
              career={career}
              onOnboarding={() => go("onboarding")}
              onHome={() => go("home")}
            />
          )}
        </main>

        <BottomTabs view={view} onGo={go} />
        <EvidenceSheet
          evidence={activeEvidence}
          onClose={() => setActiveEvidence(null)}
          onCopy={copyEvidence}
        />
        {toast && <div className="toast">{toast}</div>}
      </div>
    </div>
  );
}

function WelcomeScreen({
  onStart,
  onDemo,
  onSignIn,
}: {
  onStart: () => void;
  onDemo: () => void;
  onSignIn: () => void;
}) {
  return (
    <section className="screen welcome-screen">
      <div className="hero-visual" aria-hidden="true">
        <div className="folio-card card-a">
          <span>01</span>
          <strong>브랜드 시스템</strong>
          <small>p.12 근거</small>
        </div>
        <div className="folio-card card-b">
          <span>핏 점수</span>
          <strong>78</strong>
          <small>좋은 기반</small>
        </div>
        <div className="folio-card card-c">
          <span>추천</span>
          <strong>맞춤공고 제안</strong>
          <small>프로필 기반</small>
        </div>
      </div>

      <div className="eyebrow">포트폴리오 분석 + 맞춤공고 추천</div>
      <h1>
        내 포트폴리오가
        <br />이 회사에 어떻게 보일까요?
      </h1>
      <p className="lede">
        채용공고와 포트폴리오를 함께 분석해 무엇을 앞에 보여주고 어떤
        근거를 보완해야 하는지 알려드립니다.
      </p>

      <div className="action-stack">
        <button className="primary-button" type="button" onClick={onStart}>
          시작하기
        </button>
        <button className="secondary-button" type="button" onClick={onDemo}>
          결과 보기
        </button>
        <button className="text-button" type="button" onClick={onSignIn}>
          이미 계정이 있어요
        </button>
      </div>

      <div className="trust-strip">
        <span>합격 확률 표시 없음</span>
        <span>근거 연결</span>
        <span>파일 비공개</span>
      </div>
    </section>
  );
}

function OnboardingScreen({
  field,
  fieldInfo,
  specialties,
  career,
  onField,
  onSpecialty,
  onCareer,
  onNext,
}: {
  field: Field;
  fieldInfo: (typeof fields)[Field];
  specialties: string[];
  career: string;
  onField: (field: Field) => void;
  onSpecialty: (specialty: string) => void;
  onCareer: (career: string) => void;
  onNext: () => void;
}) {
  return (
    <section className="screen">
      <StepHeader label="온보딩" title="어떤 분야의 포트폴리오인가요?" />
      <div className="section-band-stack">
        <section className="section-band">
          <SectionTitle
            title="메인 분야"
            subtitle="분석 기준이 되는 큰 분야입니다. 하나만 선택합니다."
          />
          <div className="main-field-grid">
            {fieldKeys.map((item) => (
              <button
                key={item}
                className={`main-field-card ${field === item ? "is-selected" : ""}`}
                type="button"
                onClick={() => onField(item)}
                aria-pressed={field === item}
              >
                <span className="main-field-dot" aria-hidden="true" />
                <span>
                  <strong>{fields[item].title}</strong>
                  <small>{fields[item].subtitle}</small>
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="section-band">
          <SectionTitle
            title="세부 지원맥락"
            subtitle={`${fieldInfo.signal} · 중복 선택 가능`}
          />
          <div className="chip-grid">
            {fieldInfo.specialties.map((item) => (
              <button
                key={item}
                className={`chip ${specialties.includes(item) ? "is-selected" : ""}`}
                type="button"
                onClick={() => onSpecialty(item)}
                aria-pressed={specialties.includes(item)}
              >
                {displaySpecialty(item)}
              </button>
            ))}
          </div>
          <p className="selected-context-summary">
            선택됨: {selectedSpecialtyText(specialties)}
          </p>
        </section>

        <section className="section-band">
          <SectionTitle
            title="경력 단계"
            subtitle="점수 가산이 아니라 설명 기대 수준에만 사용합니다."
          />
          <div className="segmented-grid">
            {careerLevels.map((item) => (
              <button
                key={item}
                className={career === item ? "is-active" : ""}
                type="button"
                onClick={() => onCareer(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </section>

      </div>

      <button className="primary-button sticky-cta" type="button" onClick={onNext}>
        홈으로 이동
      </button>
    </section>
  );
}

function HomeScreen({
  fieldInfo,
  onNew,
  onResult,
  onSuggestions,
}: {
  field: Field;
  fieldInfo: (typeof fields)[Field];
  onNew: () => void;
  onResult: () => void;
  onSuggestions: () => void;
}) {
  return (
    <section className="screen">
      <div className="home-hero">
        <span className="badge">{fieldInfo.title}</span>
        <h2>다음 지원을 준비하고 있나요?</h2>
        <p>
          공고를 먼저 이해하고, 포트폴리오를 연결한 뒤, 가장 먼저 고칠 부분만
          차근차근 보여드립니다.
        </p>
        <button className="primary-button" type="button" onClick={onNew}>
          공고 분석 시작
        </button>
      </div>

      <article className="guided-card">
        <div>
          <span className="badge signal">추천 흐름</span>
          <h3>오늘은 3단계만 따라가면 됩니다</h3>
          <p>
            처음부터 모든 결과를 보지 않아도 괜찮아요. 공고 이해부터 시작해서
            필요한 근거만 하나씩 확인합니다.
          </p>
        </div>
        <div className="guide-steps" aria-label="분석 추천 흐름">
          {[
            ["1", "공고 분석", "링크나 이미지로 기업과 원하는 직군을 먼저 정리"],
            ["2", "포트폴리오 연결", "직무 요구와 내 프로젝트가 만나는 지점 확인"],
            ["3", "수정 순서", "오늘 고칠 항목부터 근거와 함께 확인"],
          ].map(([number, title, copy], index) => (
            <button
              key={title}
              className={`guide-step ${index === 0 ? "is-active" : ""}`}
              type="button"
              onClick={index === 0 ? onNew : onResult}
            >
              <span>{number}</span>
              <strong>{title}</strong>
              <small>{copy}</small>
            </button>
          ))}
        </div>
      </article>

      <div className="home-section-stack">
        <section className="home-section">
          <SectionTitle title="진행 중" subtitle="저장된 지원 자료로 작동" />
          <div className="status-card">
            <div>
              <strong>브랜드 경험 디자이너</strong>
              <span>Mori Labs · PDF 연결됨</span>
            </div>
            <button className="small-button" type="button" onClick={onResult}>
              결과
            </button>
          </div>
        </section>

        <section className="home-section">
          <SectionTitle title="맞춤공고" subtitle="저장된 프로필 기반 제안" />
          <button className="review-status-card" type="button" onClick={onSuggestions}>
            <span className="status-pill status-assigned">추천</span>
            <strong>내 프로필에 맞는 공고 제안을 받아보세요</strong>
            <small>이력서와 포트폴리오 요약을 바탕으로 지원 가능성이 높은 방향을 찾습니다.</small>
          </button>
        </section>

        <section className="home-section">
          <SectionTitle title="최근 분석" subtitle="근거 우선" />
          <AnalysisList onResult={onResult} onNew={onNew} />
        </section>
      </div>
    </section>
  );
}

function NewAnalysisScreen({
  step,
  field,
  fieldInfo,
  specialties,
  career,
  fileName,
  onStep,
  onField,
  onSpecialty,
  onCareer,
  onFile,
  onCancel,
  onStart,
  onToast,
}: {
  step: number;
  field: Field;
  fieldInfo: (typeof fields)[Field];
  specialties: string[];
  career: string;
  fileName: string;
  onStep: (step: number) => void;
  onField: (field: Field) => void;
  onSpecialty: (specialty: string) => void;
  onCareer: (career: string) => void;
  onFile: (event: ChangeEvent<HTMLInputElement>) => void;
  onCancel: () => void;
  onStart: () => void;
  onToast: (message: string) => void;
}) {
  const steps = ["공고", "포트폴리오", "추가정보", "확인"];
  const stepGuides = [
    {
      title: "먼저 공고를 이해해요",
      copy: "기업명, 직무명, 공고 링크나 이미지를 넣으면 분석글로 기업 정보와 원하는 직군을 먼저 정리합니다.",
    },
    {
      title: "그다음 포트폴리오를 연결해요",
      copy: "PDF를 올리면 공고 요구사항과 내 프로젝트 근거를 서로 맞춰봅니다.",
    },
    {
      title: "지원 맥락을 조금만 알려주세요",
      copy: "분야와 걱정되는 부분을 더하면 분석이 더 지원자 관점에 가까워집니다.",
    },
    {
      title: "마지막으로 공개 범위를 확인해요",
      copy: "이름, 사진, 학교처럼 민감한 정보는 가린 상태로 리뷰를 이어갈 수 있습니다.",
    },
  ];
  const [sourceType, setSourceType] = useState<JobSource>("텍스트");
  const defaultJobPost =
    "브랜드 아이덴티티 및 비주얼 시스템 개발, 제품 패키지 디자인 및 양산 커뮤니케이션 경험을 찾습니다. 소비자 브랜드 또는 리테일 경험을 우대합니다.";
  const [companyName, setCompanyName] = useState(sampleAnalysis.company);
  const [jobTitle, setJobTitle] = useState(sampleAnalysis.role);
  const [jobPostText, setJobPostText] = useState(defaultJobPost);
  const [jobLink, setJobLink] = useState(
    "https://careers.morilabs.example/brand-experience-designer",
  );
  const [jobUploadName, setJobUploadName] = useState("mori-labs-job-post.png");
  const [isJobInsightOpen, setIsJobInsightOpen] = useState(false);
  const [isAnalyzingJob, setIsAnalyzingJob] = useState(false);
  const [jobInsight, setJobInsight] = useState<JobInsight | null>(null);
  const [jobInsightError, setJobInsightError] = useState("");
  const jobInsightSourceName =
    sourceType === "URL"
      ? jobLink
      : sourceType === "텍스트"
        ? "붙여넣은 공고 텍스트"
        : jobUploadName;

  const selectJobSource = (nextSourceType: JobSource) => {
    setSourceType(nextSourceType);
    setIsJobInsightOpen(false);
    setJobInsight(null);
    setJobInsightError("");
    if (nextSourceType === "이미지") {
      setJobUploadName("mori-labs-job-post.png");
    }
    if (nextSourceType === "PDF") {
      setJobUploadName("mori-labs-job-post.pdf");
    }
  };

  const handleJobUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0];
    if (nextFile) {
      setJobUploadName(nextFile.name);
      setIsJobInsightOpen(false);
      setJobInsight(null);
      setJobInsightError("");
      onToast("공고 파일명이 분석에 연결됐어요.");
    }
  };

  const readJobSource = async () => {
    setIsAnalyzingJob(true);
    setIsJobInsightOpen(false);
    setJobInsight(null);
    setJobInsightError("");

    try {
      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          jobTitle,
          jobPostText,
          jobLink,
          sourceType,
          sourceName: jobInsightSourceName,
          fileName: jobUploadName,
        }),
      });
      const payload = (await response.json()) as {
        analysis?: JobInsight;
        error?: string;
      };

      if (!response.ok || !payload.analysis) {
        throw new Error(payload.error || "분석 결과를 받지 못했습니다.");
      }

      setJobInsight(payload.analysis);
      setIsJobInsightOpen(true);
      onToast("분석글이 준비됐어요.");
    } catch (error) {
      setJobInsightError(
        error instanceof Error ? error.message : "분석에 실패했습니다.",
      );
    } finally {
      setIsAnalyzingJob(false);
    }
  };

  return (
    <section className="screen">
      <StepHeader label="새 분석" title={steps[step]} />
      <div className="stepper" aria-label="분석 단계">
        {steps.map((item, index) => (
          <button
            key={item}
            className={index <= step ? "is-active" : ""}
            type="button"
            onClick={() => onStep(index)}
          >
            <span>{index + 1}</span>
            {item}
          </button>
        ))}
      </div>

      <div className="step-guide-card">
        <span>{step + 1}단계</span>
        <strong>{stepGuides[step].title}</strong>
        <p>{stepGuides[step].copy}</p>
      </div>

      <div className="section-band-stack analysis-step-stack">
        {step === 0 && (
          <section className="section-band">
            <div className="form-stack">
          <label>
            기업명
            <input
              value={companyName}
              aria-label="기업명"
              onChange={(event) => {
                setCompanyName(event.target.value);
                setIsJobInsightOpen(false);
              }}
            />
          </label>
          <label>
            직무명
            <input
              value={jobTitle}
              aria-label="직무명"
              onChange={(event) => {
                setJobTitle(event.target.value);
                setIsJobInsightOpen(false);
              }}
            />
          </label>
          <div className="source-tabs" aria-label="공고 입력 방식">
            {jobSourceOptions.map((item) => (
              <button
                key={item}
                className={sourceType === item ? "is-active" : ""}
                type="button"
                onClick={() => selectJobSource(item)}
              >
                {item}
              </button>
            ))}
          </div>
          {sourceType === "텍스트" ? (
            <div className="input-action-row">
              <label>
                채용공고
                <textarea
                  aria-label="채용공고"
                  value={jobPostText}
                  onChange={(event) => {
                    setJobPostText(event.target.value);
                    setIsJobInsightOpen(false);
                  }}
                />
              </label>
              <button
                className="secondary-button"
                type="button"
                onClick={readJobSource}
                disabled={isAnalyzingJob}
              >
                {isAnalyzingJob ? "분석 중" : "종합 분석하기"}
              </button>
            </div>
          ) : sourceType === "URL" ? (
            <div className="input-action-row">
              <label>
                공고 링크
                <input
                  value={jobLink}
                  aria-label="공고 링크"
                  onChange={(event) => {
                    setJobLink(event.target.value);
                    setIsJobInsightOpen(false);
                  }}
                />
              </label>
              <button
                className="secondary-button"
                type="button"
                onClick={readJobSource}
                disabled={isAnalyzingJob}
              >
                {isAnalyzingJob ? "분석 중" : "종합 분석하기"}
              </button>
            </div>
          ) : (
            <div className="source-upload-mini">
              <div>
                <strong>
                  {sourceType === "이미지" ? "공고 이미지" : "공고 PDF"}
                </strong>
                <span>{jobUploadName}</span>
              </div>
              <label className="file-button">
                {sourceType === "이미지" ? "이미지 선택" : "PDF 선택"}
                <input
                  type="file"
                  accept={sourceType === "이미지" ? "image/*" : "application/pdf"}
                  onChange={handleJobUpload}
                />
              </label>
              <button
                className="secondary-button"
                type="button"
                onClick={readJobSource}
                disabled={isAnalyzingJob}
              >
                {isAnalyzingJob ? "분석 중" : "종합 분석하기"}
              </button>
              <span className="muted-mini">
                URL 추출 실패나 로그인 필요 공고는 텍스트 붙여넣기로 자연스럽게
                전환할 수 있어요.
              </span>
              <button
                className="text-button"
                type="button"
                onClick={() => selectJobSource("텍스트")}
              >
                텍스트로 붙여넣기
              </button>
            </div>
          )}
          {isAnalyzingJob ? (
            <div className="analysis-placeholder is-loading">
              <strong>분석글을 만들고 있어요.</strong>
              <span>회사 정보, 원하는 직군, 보완할 포트폴리오 근거를 예시 문장으로 정리합니다.</span>
            </div>
          ) : jobInsightError ? (
            <div className="analysis-placeholder is-warning">
              <strong>분석글을 만들지 못했습니다.</strong>
              <span>{jobInsightError}</span>
            </div>
          ) : isJobInsightOpen && jobInsight ? (
            <JobInsightCard
              insight={jobInsight}
              companyName={companyName}
              jobTitle={jobTitle}
              sourceType={sourceType}
              sourceName={jobInsightSourceName}
              onApply={() => onToast("공고 분석 내용을 입력값에 반영했어요.")}
            />
          ) : (
            <div className="analysis-placeholder">
              <strong>기업명, 직무명, 공고 자료를 넣고 분석 버튼을 눌러주세요.</strong>
              <span>
                입력한 정보와 공고 이미지 또는 링크를 함께 보고 기업 정보와
                원하는 직군을 종합해 보여드립니다.
              </span>
            </div>
          )}
          <div className="inline-state">
            <strong>분석 결과는 확인 가능한 자료만 사용합니다.</strong>
            <span>
              공고에서 명확하지 않은 연봉, 팀 규모, 실제 권한 범위는 결과에서
              확인 필요로 표시합니다.
            </span>
          </div>
            </div>
          </section>
        )}

        {step === 1 && (
          <section className="section-band">
            <div className="upload-card">
          <div className="upload-icon" aria-hidden="true">
            PDF
          </div>
          <h3>포트폴리오 PDF</h3>
          <p>
            권장 60페이지 이하, 30MB 이하. 프로젝트명과 본인의 역할이
            포함될수록 분석 정확도가 높아집니다.
          </p>
          <label className="file-button">
            PDF 선택 또는 교체
            <input type="file" accept="application/pdf" onChange={onFile} />
          </label>
          <div className="file-row">
            <span>{fileName}</span>
            <button
              type="button"
              onClick={() => onStep(1)}
              aria-label="업로드 취소"
            >
              취소
            </button>
          </div>
          <div className="progress-track" aria-label="업로드 준비 완료">
            <span style={{ width: "100%" }} />
          </div>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="section-band">
            <div className="form-stack">
          <SectionTitle
            title="메인 분야"
            subtitle="지원서를 읽는 첫 기준입니다. 하나만 선택합니다."
          />
          <div className="main-field-grid compact">
            {fieldKeys.map((item) => (
              <button
                key={item}
                className={`main-field-card ${field === item ? "is-selected" : ""}`}
                type="button"
                onClick={() => onField(item)}
                aria-pressed={field === item}
              >
                <span className="main-field-dot" aria-hidden="true" />
                <span>
                  <strong>{fields[item].title}</strong>
                  <small>{fields[item].subtitle}</small>
                </span>
              </button>
            ))}
          </div>
          <SectionTitle
            title="세부 지원맥락"
            subtitle={`${fieldInfo.signal} · 중복 선택 가능`}
          />
          <div className="chip-grid" aria-label="세부 지원맥락 중복 선택">
            {fieldInfo.specialties.map((item) => (
              <button
                key={item}
                className={`chip ${specialties.includes(item) ? "is-selected" : ""}`}
                type="button"
                onClick={() => onSpecialty(item)}
                aria-pressed={specialties.includes(item)}
              >
                {displaySpecialty(item)}
              </button>
            ))}
          </div>
          <p className="selected-context-summary">
            선택됨: {selectedSpecialtyText(specialties)}
          </p>
          <label>
            경력 단계
            <select value={career} onChange={(event) => onCareer(event.target.value)}>
              {careerLevels.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            걱정되는 부분
            <textarea
              defaultValue="팀 프로젝트에서 제 역할이 충분히 보이는지 궁금합니다."
              aria-label="걱정되는 부분"
            />
          </label>
          {field === "rnd" && (
            <div className="warning-box">
              환자 정보, 미공개 데이터, 특허 출원 전 정보가 포함되지 않았는지
              확인해주세요.
            </div>
          )}
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="section-band">
            <div className="review-panel">
          <SectionTitle title="분석 전 확인" subtitle="자료 외 내용은 만들지 않습니다." />
          <InfoLine label="기업" text={sampleAnalysis.company} />
          <InfoLine label="직무" text={sampleAnalysis.role} />
          <InfoLine label="분야" text={fieldInfo.title} />
          <InfoLine label="지원맥락" text={selectedSpecialtyText(specialties)} />
          <InfoLine label="파일" text={fileName} />
          <div className="toggle-list">
            {["이름 숨김", "사진 숨김", "학교 숨김", "분석 자료 저장 동의"].map(
              (item) => (
                <label key={item} className="toggle-row">
                  <span>{item}</span>
                  <input type="checkbox" defaultChecked />
                </label>
              ),
            )}
          </div>
            </div>
          </section>
        )}
      </div>

      <div className="form-actions">
        <button className="secondary-button" type="button" onClick={onCancel}>
          나가기
        </button>
        {step > 0 && (
          <button
            className="secondary-button"
            type="button"
            onClick={() => onStep(step - 1)}
          >
            이전
          </button>
        )}
        {step < 3 ? (
          <button
            className="primary-button"
            type="button"
            onClick={() => onStep(step + 1)}
          >
            다음
          </button>
        ) : (
          <button className="primary-button" type="button" onClick={onStart}>
            분석 시작
          </button>
        )}
      </div>
    </section>
  );
}

function JobInsightCard({
  insight,
  companyName,
  jobTitle,
  sourceType,
  sourceName,
  onApply,
}: {
  insight: JobInsight;
  companyName: string;
  jobTitle: string;
  sourceType: JobSource;
  sourceName: string;
  onApply: () => void;
}) {
  const company = companyName.trim() || "입력한 기업";
  const role = jobTitle.trim() || "입력한 직무";
  const insightRows = [
    {
      label: "기업 정보",
      text: insight.companyInfo,
    },
    {
      label: "원하는 직군",
      text: insight.targetRole || role,
    },
    {
      label: "핵심 요구",
      text: insight.mustHave.join(", "),
    },
    {
      label: "우대 신호",
      text: insight.preferredSignals.join(", "),
    },
    {
      label: "확인 필요",
      text: insight.unclear.join(", "),
    },
    {
      label: "포트폴리오",
      text: insight.portfolioAdvice,
    },
  ];

  return (
    <article className="job-insight-card">
      <div className="insight-head">
        <div>
          <span className="badge signal">{sourceType} 기반 공고 분석</span>
          <h3>{company} 공고를 분석글로 정리했어요</h3>
        </div>
        <small>{sourceName}</small>
      </div>
      <p className="insight-summary">{insight.summary}</p>
      <div className="insight-list">
        {insightRows.map((item) => (
          <div key={item.label} className="insight-line">
            <span>{item.label}</span>
            <p>{item.text}</p>
          </div>
        ))}
      </div>
      <div className="source-note-list">
        <strong>분석 신뢰도 {insight.confidence}</strong>
        {insight.sourceNotes.map((note) => (
          <span key={note}>{note}</span>
        ))}
      </div>
      <button className="primary-button" type="button" onClick={onApply}>
        이 분석을 공고 정보에 반영
      </button>
    </article>
  );
}

function ProgressScreen({
  progressIndex,
  isDone,
  onResult,
  onHome,
}: {
  progressIndex: number;
  isDone: boolean;
  onResult: () => void;
  onHome: () => void;
}) {
  return (
    <section className="screen progress-screen">
      <StepHeader label="분석 중" title="근거를 연결하고 있어요" />
      <p className="muted">
        앱을 닫아도 작업은 유지됩니다. 임의 퍼센트 대신 실제 처리 단계를
        보여드립니다.
      </p>
      <div className="stage-list">
        {progressStages.map((item, index) => (
          <div
            key={item}
            className={`stage-row ${index <= progressIndex ? "is-done" : ""}`}
          >
            <span>{index + 1}</span>
            <strong>{item}</strong>
          </div>
        ))}
      </div>
      <div className="action-stack">
        <button
          className="primary-button"
          type="button"
          onClick={onResult}
          disabled={!isDone}
        >
          결과 보기
        </button>
        <button className="text-button" type="button" onClick={onHome}>
          홈에서 기다리기
        </button>
      </div>
    </section>
  );
}

function ResultScreen({
  tab,
  onTab,
  onEvidence,
  onSuggestions,
  onNew,
  onDelete,
}: {
  tab: ResultTab;
  onTab: (tab: ResultTab) => void;
  onEvidence: (evidence: EvidenceDetail) => void;
  onSuggestions: () => void;
  onNew: () => void;
  onDelete: () => void;
}) {
  const tabs: Array<{ key: ResultTab; label: string }> = [
    { key: "summary", label: "요약" },
    { key: "requirements", label: "요구사항" },
    { key: "projects", label: "프로젝트" },
    { key: "pages", label: "페이지" },
    { key: "rewrite", label: "문구수정" },
    { key: "interview", label: "면접질문" },
  ];

  return (
    <section className="screen result-screen">
      <section className="section-band result-summary-band">
        <div className="result-header">
          <div>
            <span className="badge">생성일 {sampleAnalysis.generatedAt}</span>
            <h2>{sampleAnalysis.company}</h2>
            <p>{sampleAnalysis.role}</p>
          </div>
          <div className="score-ring" aria-label={`핏 점수 ${sampleAnalysis.score}`}>
            <strong>{sampleAnalysis.score}</strong>
            <span>점수</span>
          </div>
        </div>

        <p className="score-note">{sampleAnalysis.disclaimer}</p>
      </section>

      <section className="section-band result-nav-band">
        <ResultGuide activeTab={tab} onTab={onTab} />

        <div className="mini-actions result-actions">
          <button className="rerun-action" type="button" onClick={onNew}>
            다시 분석
          </button>
          <button className="delete-action" type="button" onClick={onDelete}>
            삭제
          </button>
        </div>

        <div className="tab-row" aria-label="결과 섹션">
          {tabs.map((item) => (
            <button
              key={item.key}
              className={tab === item.key ? "is-active" : ""}
              type="button"
              onClick={() => onTab(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {tab === "summary" && (
        <div className="section-band-stack result-content-bands">
          <section className="section-band">
            <ScoreSummary onEvidence={onEvidence} />
          </section>
          <section className="section-band">
            <SectionTitle title="우선 수정" subtitle="낮은 노력으로 효과가 큰 항목" />
            <div className="content-stack">
              {sampleAnalysis.priorities.map((item, index) => (
                <PriorityCard
                  key={item.title}
                  index={index + 1}
                  item={item}
                  onEvidence={onEvidence}
                />
              ))}
            </div>
          </section>
        </div>
      )}

      {tab === "requirements" && (
        <section className="section-band">
          <div className="content-stack">
            {sampleAnalysis.requirements.map((item) => (
              <RequirementCard key={item.title} item={item} onEvidence={onEvidence} />
            ))}
          </div>
        </section>
      )}

      {tab === "projects" && (
        <section className="section-band">
          <div className="content-stack">
            <p className="section-copy">
              이 지원에서는 다음 순서가 가장 빠르게 직무 적합성을 보여줍니다.
            </p>
            {sampleAnalysis.projects.map((item) => (
              <ProjectCard key={item.name} item={item} onEvidence={onEvidence} />
            ))}
          </div>
        </section>
      )}

      {tab === "pages" && (
        <section className="section-band">
          <div className="content-stack">
            {sampleAnalysis.pages.map((item) => (
              <PageFeedbackCard
                key={`${item.page}-${item.title}`}
                item={item}
                onEvidence={onEvidence}
              />
            ))}
          </div>
        </section>
      )}

      {tab === "rewrite" && (
        <section className="section-band">
          <RewritePanel onEvidence={onEvidence} />
        </section>
      )}

      {tab === "interview" && (
        <section className="section-band">
          <InterviewPanel onEvidence={onEvidence} />
        </section>
      )}

      <button
        className="primary-button sticky-cta"
        type="button"
        onClick={onSuggestions}
      >
        맞춤공고 추천 보기
      </button>
    </section>
  );
}

function ResultGuide({
  activeTab,
  onTab,
}: {
  activeTab: ResultTab;
  onTab: (tab: ResultTab) => void;
}) {
  const guideItems: Array<{
    step: string;
    label: string;
    copy: string;
    tab: ResultTab;
  }> = [
    {
      step: "1",
      label: "우선 수정 2개",
      copy: "오늘 바로 고칠 항목만 먼저 봅니다.",
      tab: "summary",
    },
    {
      step: "2",
      label: "요구사항 일부 확인",
      copy: "공고에서 중요한 조건이 어디까지 보이는지 확인합니다.",
      tab: "requirements",
    },
    {
      step: "3",
      label: "페이지별 근거",
      copy: "근거 보기를 열어 실제 판단 이유를 검토합니다.",
      tab: "pages",
    },
  ];

  return (
    <article className="result-guide-card">
      <div>
        <span className="badge signal">읽는 순서</span>
        <h3>처음엔 이것만 보세요</h3>
      </div>
      <div className="result-guide-list" aria-label="결과 읽는 순서">
        {guideItems.map((item) => (
          <button
            key={item.label}
            className={activeTab === item.tab ? "is-active" : ""}
            type="button"
            onClick={() => onTab(item.tab)}
          >
            <span>{item.step}</span>
            <strong>{item.label}</strong>
            <small>{item.copy}</small>
          </button>
        ))}
      </div>
    </article>
  );
}

function ScoreSummary({
  onEvidence,
}: {
  onEvidence: (evidence: EvidenceDetail) => void;
}) {
  return (
    <div className="score-summary">
      <div>
        <span className="badge signal">{sampleAnalysis.label}</span>
        <h3>{sampleAnalysis.summary}</h3>
      </div>
      <section className="score-panel strength-panel">
        <SectionTitle title="강점" subtitle="현재 자료에서 확인되는 부분" />
        <div className="strength-list">
          {sampleAnalysis.strengths.map((item, index) => (
            <button
              key={item}
              className="evidence-button"
              type="button"
              onClick={() =>
                onEvidence(
                  evidenceDetail({
                    title: item,
                    source: "포트폴리오",
                    excerpt:
                      item === sampleAnalysis.strengths[0]
                        ? "p.12 Identity, package and digital guest experience"
                        : "p.25 In-store screen order experience",
                    reason:
                      item === sampleAnalysis.strengths[0]
                        ? "브랜드 아이덴티티가 패키지와 디지털 접점까지 확장된 장면이 확인됩니다."
                        : "리테일 고객 접점에서 실제 사용 흐름을 설계한 근거가 있습니다.",
                    page: item === sampleAnalysis.strengths[0] ? "12" : "25",
                    project:
                      item === sampleAnalysis.strengths[0]
                        ? "Mori Stay Brand System"
                        : "Retail Order UI",
                    confidence: "높음",
                    nextAction:
                      "이 근거가 결과 화면 상단에서 더 빨리 보이도록 프로젝트 순서를 조정하세요.",
                  }),
                )
              }
            >
              <small>{String(index + 1).padStart(2, "0")}</small>
              <strong>{item}</strong>
              <span>근거 보기</span>
            </button>
          ))}
        </div>
      </section>
      <section className="score-panel dimension-panel">
        <SectionTitle title="점수 차원" subtitle="서버 가중치 기준" />
        <div className="dimension-list">
          {sampleAnalysis.dimensions.map(([label, score, summary]) => (
            <div key={label} className="dimension-row">
              <div>
                <strong>{dimensionLabels[label] ?? label}</strong>
                <span>{summary}</span>
              </div>
              <b>{score}</b>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function PriorityCard({
  index,
  item,
  onEvidence,
}: {
  index: number;
  item: (typeof sampleAnalysis.priorities)[number];
  onEvidence: (evidence: EvidenceDetail) => void;
}) {
  return (
    <article className="data-card">
      <div className="card-kicker">우선순위 {index}</div>
      <h3>{item.title}</h3>
      <p>{item.detail}</p>
      <div className="tag-row">
        <span>{effortLabels[item.effort] ?? item.effort}</span>
        {item.evidence.map((evidence) => (
          <button
            key={evidence}
            type="button"
            onClick={() =>
              onEvidence(
                evidenceDetail({
                  title: item.title,
                  source: evidence.startsWith("공고") ? "채용공고" : "포트폴리오",
                  excerpt: evidence,
                  reason: item.detail,
                  page: evidence.includes("p.12")
                    ? "12"
                    : evidence.includes("p.18")
                      ? "18"
                      : undefined,
                  project: evidence.includes("p.")
                    ? "Mori Stay Brand System"
                    : undefined,
                  confidence: evidence.startsWith("공고") ? "높음" : "중간",
                  nextAction: item.title,
                }),
              )
            }
          >
            {evidence}
          </button>
        ))}
      </div>
    </article>
  );
}

function RequirementCard({
  item,
  onEvidence,
}: {
  item: (typeof sampleAnalysis.requirements)[number];
  onEvidence: (evidence: EvidenceDetail) => void;
}) {
  return (
    <article className="data-card">
      <div className="card-topline">
        <span className={`coverage coverage-${item.status.toLowerCase()}`}>
          {coverageLabels[item.status] ?? item.status}
        </span>
        <span>{item.importance}</span>
      </div>
      <h3>{item.title}</h3>
      <EvidenceSnippet
        label="공고 원문"
        text={item.job}
        evidence={evidenceDetail({
          title: `${item.title} 요구사항`,
          source: "채용공고",
          excerpt: item.job,
          reason: `${item.importance} 조건으로 확인된 요구사항입니다.`,
          confidence: "높음",
          nextAction: item.action,
        })}
        onClick={onEvidence}
      />
      <EvidenceSnippet
        label="포트폴리오 근거"
        text={item.evidence}
        evidence={evidenceDetail({
          title: `${item.title} 포트폴리오 근거`,
          source: "포트폴리오",
          excerpt: item.evidence,
          reason:
            item.status === "Partial"
              ? "결과물은 확인되지만 제작 조건과 협력사 조율 과정은 아직 부족합니다."
              : "지원 직무 요구와 연결되는 산출물이 확인됩니다.",
          page: item.evidence.match(/p\.(\d+)/)?.[1],
          project: item.evidence.replace(/^p\.\d+\s*/, ""),
          confidence: item.status === "Partial" ? "중간" : "높음",
          nextAction: item.action,
        })}
        onClick={onEvidence}
      />
      <p>{item.action}</p>
    </article>
  );
}

function ProjectCard({
  item,
  onEvidence,
}: {
  item: (typeof sampleAnalysis.projects)[number];
  onEvidence: (evidence: EvidenceDetail) => void;
}) {
  return (
    <article className="data-card project-card">
      <div className="rank-row">
        <span>현재 {item.current}</span>
        <b>추천 {item.recommended}</b>
        <strong>{item.score}</strong>
      </div>
      <h3>{item.name}</h3>
      <p>{item.reason}</p>
      <button
        className="inline-evidence"
        type="button"
        onClick={() =>
          onEvidence(
            evidenceDetail({
              title: `${item.name} 추천 순서 근거`,
              source: "자동 분석",
              excerpt: `현재 ${item.current}번째 → 추천 ${item.recommended}번째, 관련도 ${item.score}`,
              reason: item.reason,
              project: item.name,
              confidence: "높음",
              nextAction: `${item.name}을(를) ${item.recommended}번째 프로젝트로 배치하세요.`,
            }),
          )
        }
      >
        추천 근거 보기
      </button>
      <div className="tag-row">
        {item.tags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
    </article>
  );
}

function PageFeedbackCard({
  item,
  onEvidence,
}: {
  item: (typeof sampleAnalysis.pages)[number];
  onEvidence: (evidence: EvidenceDetail) => void;
}) {
  return (
    <article className="page-card">
      <div className="page-thumb">p.{item.page}</div>
      <div>
        <span className="badge">{pageStatusLabels[item.status] ?? item.status}</span>
        <h3>{item.title}</h3>
        <p>{item.change}</p>
        <button
          className="inline-evidence"
          type="button"
          onClick={() =>
            onEvidence(
              evidenceDetail({
                title: `p.${item.page} 페이지 진단 근거`,
                source: "포트폴리오",
                excerpt: `p.${item.page} ${item.project}`,
                reason: item.diagnosis,
                page: String(item.page),
                project: item.project,
                confidence: item.status === "Add evidence" ? "중간" : "높음",
                nextAction: item.change,
              }),
            )
          }
        >
          페이지 근거 보기
        </button>
      </div>
    </article>
  );
}

function RewritePanel({
  onEvidence,
}: {
  onEvidence: (evidence: EvidenceDetail) => void;
}) {
  return (
    <div className="content-stack">
      <article className="rewrite-card">
        <div className="card-topline">
          <span>수정 위치 p.{sampleAnalysis.rewrite.page}</span>
          <span>{sampleAnalysis.rewrite.project}</span>
        </div>
        <span className="badge">기존 문구</span>
        <p>{sampleAnalysis.rewrite.original}</p>
      </article>
      <article className="rewrite-card after">
        <div className="card-topline">
          <span>추천 반영 p.{sampleAnalysis.rewrite.page}</span>
          <span>{sampleAnalysis.rewrite.project}</span>
        </div>
        <span className="badge signal">추천 문구</span>
        <p>{sampleAnalysis.rewrite.suggested}</p>
        <small>{sampleAnalysis.rewrite.warning}</small>
      </article>
      <div className="mini-actions">
        <button
          type="button"
          onClick={() => navigator.clipboard?.writeText(sampleAnalysis.rewrite.suggested)}
        >
          복사
        </button>
        <button
          type="button"
          onClick={() =>
            onEvidence(
              evidenceDetail({
                title: "문구 수정 근거",
                source: "포트폴리오",
                excerpt: `p.${sampleAnalysis.rewrite.page} ${sampleAnalysis.rewrite.project} · Identity, package and digital guest experience`,
                reason:
                  "공고의 브랜드 시스템·패키지 요구와 연결되도록 기존 설명을 직무 언어로 재구성했습니다.",
                page: String(sampleAnalysis.rewrite.page),
                project: sampleAnalysis.rewrite.project,
                confidence: "높음",
                nextAction: "추천 문구를 그대로 쓰기보다 본인의 실제 역할 범위를 함께 확인해 반영하세요.",
              }),
            )
          }
        >
          근거 보기
        </button>
      </div>
      <SectionTitle
        title="자료 보강이 필요한 부분"
        subtitle="경험이 없어서가 아니라 자료에서 확인되지 않는 것일 수 있어요."
      />
      {sampleAnalysis.missingProof.map((item) => (
        <article className="data-card" key={item.requirement}>
          <div className="card-topline">
            <span>{coverageLabels[item.status] ?? item.status}</span>
            <span>{item.placement}</span>
          </div>
          <h3>{item.requirement}</h3>
          <p>{item.question}</p>
          <strong>{item.proof}</strong>
          <button
            className="inline-evidence"
            type="button"
            onClick={() =>
              onEvidence(
                evidenceDetail({
                  title: "자료 보강 판단 근거",
                  source: "자동 분석",
                  excerpt: "공고: 제품 패키지 디자인 및 양산 커뮤니케이션 / p.18 패키지 목업",
                  reason:
                    "패키지 목업은 확인되지만 실제 제작 사양, 소재 선택 이유, 협력사 조율 과정은 업로드 자료에서 확인되지 않습니다.",
                  page: String(item.page),
                  project: "Mori Stay Brand System",
                  confidence: "중간",
                  nextAction: `${item.placement}에 ${item.proof} 중 공개 가능한 내용을 추가하세요.`,
                }),
              )
            }
          >
            부족 근거 보기
          </button>
        </article>
      ))}
    </div>
  );
}

function InterviewPanel({
  onEvidence,
}: {
  onEvidence: (evidence: EvidenceDetail) => void;
}) {
  return (
    <div className="content-stack">
      {sampleAnalysis.interview.map((item) => (
        <article className="data-card" key={item.question}>
          <span className="badge">{item.category}</span>
          <h3>{item.question}</h3>
          <button
            className="inline-evidence"
            type="button"
            onClick={() =>
              onEvidence(
                evidenceDetail({
                  title: "면접 질문 생성 근거",
                  source: "자동 분석",
                  excerpt:
                    item.category === "역할 검증"
                      ? "p.12 Team project"
                      : "공고: 제품 패키지 디자인 및 양산 커뮤니케이션",
                  reason: item.why,
                  page: item.category === "역할 검증" ? "12" : "18",
                  project: "Mori Stay Brand System",
                  confidence: "중간",
                  nextAction: `답변 구조: ${item.framework}`,
                }),
              )
            }
          >
            질문 근거 보기
          </button>
        </article>
      ))}
    </div>
  );
}

function ReviewRequestScreen({
  perspective,
  reviewStatus,
  onPerspective,
  onRequest,
  onAdmin,
  onResult,
}: {
  perspective: string;
  reviewStatus: ReviewStatus;
  onPerspective: (perspective: string) => void;
  onRequest: () => void;
  onAdmin: () => void;
  onResult: () => void;
}) {
  return (
    <section className="screen">
      <StepHeader label="전문가 리뷰" title="검증된 전문가에게 연결" />
      <p className="muted">
        베타에서는 운영팀이 분야와 관점에 맞는 전문가를 직접 배정합니다.
      </p>
      <div className="segmented-grid four">
        {["HR", "직무 실무", "산업", "종합"].map((item) => (
          <button
            key={item}
            className={perspective === item ? "is-active" : ""}
            type="button"
            onClick={() => onPerspective(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <article className="expert-card">
        <div className="expert-avatar" aria-hidden="true">
          VF
        </div>
        <div>
          <div className="card-topline">
            <span className="badge signal">검증 완료</span>
            <span>리뷰 42</span>
          </div>
          <h3>브랜드 리드 리뷰어</h3>
          <p>디자인 팀장 · 채용 면접 80회 이상 · 회사명 비공개</p>
        </div>
      </article>
      <div className="toggle-list">
        {["이름 숨김", "사진 숨김", "학교 숨김"].map((item) => (
          <label key={item} className="toggle-row">
            <span>{item}</span>
            <input type="checkbox" defaultChecked />
          </label>
        ))}
      </div>

      {reviewStatus !== "not_requested" && (
        <ReviewTimeline status={reviewStatus} />
      )}

      <div className="form-actions">
        <button className="secondary-button" type="button" onClick={onResult}>
          결과로 돌아가기
        </button>
        {reviewStatus === "not_requested" ? (
          <button className="primary-button" type="button" onClick={onRequest}>
            리뷰 요청
          </button>
        ) : (
          <button className="primary-button" type="button" onClick={onAdmin}>
            운영팀 배정 보기
          </button>
        )}
      </div>
    </section>
  );
}

function AdminScreen({
  reviewStatus,
  onEvidence,
  onAssign,
  onExpert,
  onCandidate,
}: {
  reviewStatus: ReviewStatus;
  onEvidence: (evidence: EvidenceDetail) => void;
  onAssign: () => void;
  onExpert: () => void;
  onCandidate: () => void;
}) {
  return (
    <section className="screen">
      <StepHeader label="운영자" title="전문가 검증과 배정" />
      <div className="metric-grid">
        <Metric label="대기 요청" value="1" />
        <Metric label="검증 전문가" value="18" />
        <Metric label="신고" value="0" />
      </div>
      <article className="data-card">
        <div className="card-topline">
          <span className="badge">리뷰 요청</span>
          <span>{statusLabel(reviewStatus)}</span>
        </div>
        <h3>Mori Labs · 브랜드 경험 디자이너</h3>
        <p>분야 디자인, 관점 종합. 이름·사진·학교 블라인드 공유.</p>
        <EvidenceSnippet
          label="자동 요약"
          text="개인 기여도와 패키지 제작 근거 보완 필요"
          evidence={evidenceDetail({
            title: "운영자 배정용 자동 요약 근거",
            source: "자동 분석",
            excerpt:
              "공고 발췌: 브랜드 아이덴티티 및 제품 패키지 디자인 / 포트폴리오: p.12, p.18",
            reason:
              "배정할 전문가는 브랜드 시스템과 패키지 제작 경험을 함께 볼 수 있어야 합니다.",
            page: "12, 18",
            project: "Mori Stay Brand System",
            confidence: "높음",
            nextAction: "브랜드·패키지 채용 경험이 있는 검증 전문가에게 배정하세요.",
          })}
          onClick={onEvidence}
        />
      </article>
      <article className="data-card">
        <div className="card-topline">
          <span className="badge signal">후보 전문가</span>
          <span>이해상충 확인 전</span>
        </div>
        <h3>브랜드 리드 리뷰어</h3>
        <p>채용 면접 80회 이상, 브랜드 시스템과 패키지 포트폴리오 리뷰 가능.</p>
      </article>
      <div className="form-actions">
        <button className="secondary-button" type="button" onClick={onCandidate}>
          후보자 홈
        </button>
        <button className="secondary-button" type="button" onClick={onExpert}>
          전문가 화면
        </button>
        <button className="primary-button" type="button" onClick={onAssign}>
          배정
        </button>
      </div>
    </section>
  );
}

function ExpertScreen({
  reviewStatus,
  conflictChecked,
  draft,
  onConflict,
  onDraft,
  onAccept,
  onDecline,
  onSubmit,
  onBack,
}: {
  reviewStatus: ReviewStatus;
  conflictChecked: boolean;
  draft: { first: string; priority: string; question: string };
  onConflict: (checked: boolean) => void;
  onDraft: (draft: { first: string; priority: string; question: string }) => void;
  onAccept: () => void;
  onDecline: () => void;
  onSubmit: () => void;
  onBack: () => void;
}) {
  const canEdit = statusReached(reviewStatus, "assigned");
  return (
    <section className="screen">
      <StepHeader label="전문가" title="구조화 리뷰 작성" />
      <article className="data-card">
        <div className="card-topline">
          <span className="badge">배정된 요청</span>
          <span>{statusLabel(reviewStatus)}</span>
        </div>
        <h3>Mori Labs · 브랜드 경험 디자이너</h3>
        <p>
          블라인드 자료입니다. 현재 본인이 관여한 채용이 아니며 내부 비공개
          기준을 공유하지 않아야 합니다.
        </p>
      </article>

      {!statusReached(reviewStatus, "in_review") && (
        <div className="toggle-list">
          <label className="toggle-row">
            <span>이해상충 없음 확인</span>
            <input
              type="checkbox"
              checked={conflictChecked}
              onChange={(event) => onConflict(event.target.checked)}
            />
          </label>
        </div>
      )}

      {canEdit && (
        <div className="form-stack">
          <label>
            첫 30초 인상
            <textarea
              value={draft.first}
              onChange={(event) =>
                onDraft({ ...draft, first: event.target.value })
              }
            />
          </label>
          <label>
            반드시 수정할 것
            <textarea
              value={draft.priority}
              onChange={(event) =>
                onDraft({ ...draft, priority: event.target.value })
              }
            />
          </label>
          <label>
            실제 면접 질문
            <textarea
              value={draft.question}
              onChange={(event) =>
                onDraft({ ...draft, question: event.target.value })
              }
            />
          </label>
          <div className="autosave">자동 저장됨 · 전문가 원문 보존</div>
        </div>
      )}

      <div className="form-actions">
        <button className="secondary-button" type="button" onClick={onBack}>
          나가기
        </button>
        {!statusReached(reviewStatus, "in_review") ? (
          <>
            <button className="secondary-button" type="button" onClick={onDecline}>
              거절
            </button>
            <button className="primary-button" type="button" onClick={onAccept}>
              수락
            </button>
          </>
        ) : (
          <button className="primary-button" type="button" onClick={onSubmit}>
            리뷰 제출
          </button>
        )}
      </div>
    </section>
  );
}

function IntegratedScreen({
  draft,
  onHome,
  onNew,
  onResult,
}: {
  draft: { first: string; priority: string; question: string };
  onHome: () => void;
  onNew: () => void;
  onResult: () => void;
}) {
  return (
    <section className="screen">
      <StepHeader label="통합 결과" title="자동 분석과 전문가 공통 우선순위" />
      <article className="data-card shared">
        <span className="badge signal">공통 지적</span>
        <h3>개인 기여도와 패키지 제작 근거를 초반에 보강하세요.</h3>
        <p>
          자동 분석과 전문가 리뷰 모두 Mori Stay 프로젝트의 순서 이동과 p.12
          역할 설명 추가를 우선 적용 항목으로 보았습니다.
        </p>
      </article>
      <article className="data-card">
        <span className="badge">전문가 리뷰</span>
        <h3>첫 30초</h3>
        <p>{draft.first}</p>
      </article>
      <article className="data-card">
        <span className="badge">자동 분석</span>
        <h3>자동 분석만 지적</h3>
        <p>리테일 고객 접점 경험은 강점이지만 공고와의 연결 문장이 늦게 등장합니다.</p>
      </article>
      <article className="data-card">
        <span className="badge">전문가만 발견</span>
        <h3>전문가만 발견</h3>
        <p>{draft.priority}</p>
        <strong>{draft.question}</strong>
      </article>
      <div className="form-actions">
        <button className="secondary-button" type="button" onClick={onResult}>
          분석 결과
        </button>
        <button className="secondary-button" type="button" onClick={onNew}>
          새 분석
        </button>
        <button className="primary-button" type="button" onClick={onHome}>
          홈
        </button>
      </div>
    </section>
  );
}

function ProfileScreen({
  fieldInfo,
  career,
  onOnboarding,
  onHome,
}: {
  fieldInfo: (typeof fields)[Field];
  career: string;
  onOnboarding: () => void;
  onHome: () => void;
}) {
  const [profile, setProfile] = useState<SavedProfile>({
    ...defaultProfile,
    field: fieldInfo.title,
    career,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isProfileSaved, setIsProfileSaved] = useState(false);
  const [isProfileEditing, setIsProfileEditing] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    let isMounted = true;
    fetch("/api/profile")
      .then((response) => response.json())
      .then((payload: { profile?: SavedProfile }) => {
        if (isMounted && payload.profile) {
          setProfile(payload.profile);
          const hasSavedProfile = Boolean(payload.profile.updatedAt);
          setIsProfileSaved(hasSavedProfile);
          setIsProfileEditing(!hasSavedProfile);
        }
      })
      .catch(() => {
        if (isMounted) setSaveMessage("저장된 프로필을 불러오지 못했어요.");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const updateProfile = (nextProfile: Partial<SavedProfile>) => {
    setProfile((current) => ({ ...current, ...nextProfile }));
    setIsProfileSaved(false);
    setSaveMessage("");
  };

  const profileField = fieldFromTitle(profile.field);
  const profileSpecialties = selectedSpecialtyKeysFromText(
    profile.targetRoles,
    profileField,
  );

  const updateProfileField = (nextField: Field) => {
    updateProfile({
      field: fields[nextField].title,
      targetRoles: displaySpecialty(fields[nextField].specialties[0]),
    });
  };

  const toggleProfileSpecialty = (nextSpecialty: string) => {
    const nextSpecialties = profileSpecialties.includes(nextSpecialty)
      ? profileSpecialties.filter((item) => item !== nextSpecialty)
      : [...profileSpecialties, nextSpecialty];

    updateProfile({
      targetRoles: selectedSpecialtyText(nextSpecialties),
    });
  };

  const handleProfileFile = (
    key: "resumeFileName" | "portfolioFileName",
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const nextFile = event.target.files?.[0];
    if (!nextFile) return;
    updateProfile({ [key]: nextFile.name });
  };

  const save = async () => {
    setIsSaving(true);
    setSaveMessage("");

    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const payload = (await response.json()) as {
        profile?: SavedProfile;
        error?: string;
      };

      if (!response.ok || !payload.profile) {
        throw new Error(payload.error || "프로필 저장에 실패했습니다.");
      }

      setProfile(payload.profile);
      setIsProfileSaved(true);
      setIsProfileEditing(false);
      setSaveMessage("프로필, 이력서, 포트폴리오 내용이 저장됐어요.");
    } catch (error) {
      setSaveMessage(
        error instanceof Error ? error.message : "프로필 저장에 실패했습니다.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="screen">
      <StepHeader label="프로필" title="내 지원 자료 저장" />
      {isProfileSaved && !isProfileEditing ? (
        <>
          <div className="section-band-stack profile-view-stack">
            <section className="section-band">
              <ProfileSnapshot profile={profile} />
            </section>
          </div>
          {saveMessage && (
            <div className="autosave floating-status">{saveMessage}</div>
          )}
          <div className="form-actions single-action">
            <button
              className="primary-button"
              type="button"
              onClick={() => {
                setIsProfileEditing(true);
                setSaveMessage("");
              }}
            >
              설정 변경
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="section-band-stack">

        <section className="section-band">
          <article className="data-card">
            <h3>기본 정보</h3>
            <div className="form-stack compact">
              <label>
                이름 또는 표시명
                <input
                  value={profile.name}
                  onChange={(event) => updateProfile({ name: event.target.value })}
                />
              </label>
              <label>
                한 줄 소개
                <input
                  value={profile.headline}
                  onChange={(event) =>
                    updateProfile({ headline: event.target.value })
                  }
                />
              </label>
              <div className="profile-context-picker">
                <SectionTitle
                  title="메인 분야"
                  subtitle="프로필 추천 기준이 되는 큰 분야입니다."
                />
                <div className="main-field-grid compact">
                  {fieldKeys.map((item) => (
                    <button
                      key={item}
                      className={`main-field-card ${
                        profileField === item ? "is-selected" : ""
                      }`}
                      type="button"
                      onClick={() => updateProfileField(item)}
                      aria-pressed={profileField === item}
                    >
                      <span className="main-field-dot" aria-hidden="true" />
                      <span>
                        <strong>{fields[item].title}</strong>
                        <small>{fields[item].subtitle}</small>
                      </span>
                    </button>
                  ))}
                </div>
                <SectionTitle
                  title="세부 직무"
                  subtitle="여러 개를 선택하면 맞춤공고 추천에 함께 반영됩니다."
                />
                <div className="chip-grid" aria-label="프로필 세부직무 중복 선택">
                  {fields[profileField].specialties.map((item) => (
                    <button
                      key={item}
                      className={`chip ${
                        profileSpecialties.includes(item) ? "is-selected" : ""
                      }`}
                      type="button"
                      onClick={() => toggleProfileSpecialty(item)}
                      aria-pressed={profileSpecialties.includes(item)}
                    >
                      {displaySpecialty(item)}
                    </button>
                  ))}
                </div>
              </div>
              <label>
                희망 직무 직접 입력
                <input
                  value={profile.targetRoles}
                  onChange={(event) =>
                    updateProfile({ targetRoles: event.target.value })
                  }
                />
              </label>
              <label>
                선호하는 회사/산업
                <input
                  value={profile.preferences}
                  onChange={(event) =>
                    updateProfile({ preferences: event.target.value })
                  }
                />
              </label>
            </div>
          </article>
        </section>

        <section className="section-band">
          <article className="data-card">
            <h3>이력서</h3>
            <label className="file-button profile-file-button">
              이력서 파일 선택
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={(event) => handleProfileFile("resumeFileName", event)}
              />
            </label>
            {profile.resumeFileName && (
              <p className="saved-file-name">{profile.resumeFileName}</p>
            )}
            <label>
              이력서 핵심 내용
              <textarea
                value={profile.resumeText}
                onChange={(event) =>
                  updateProfile({ resumeText: event.target.value })
                }
              />
            </label>
          </article>
        </section>

        <section className="section-band">
          <article className="data-card">
            <h3>포트폴리오</h3>
            <label className="file-button profile-file-button">
              포트폴리오 파일 선택
              <input
                type="file"
                accept=".pdf,.ppt,.pptx,.key,.txt"
                onChange={(event) =>
                  handleProfileFile("portfolioFileName", event)
                }
              />
            </label>
            {profile.portfolioFileName && (
              <p className="saved-file-name">{profile.portfolioFileName}</p>
            )}
            <label>
              포트폴리오 핵심 프로젝트
              <textarea
                value={profile.portfolioText}
                onChange={(event) =>
                  updateProfile({ portfolioText: event.target.value })
                }
              />
            </label>
          </article>
        </section>
          </div>
          {saveMessage && (
            <div className="autosave floating-status">{saveMessage}</div>
          )}
          <div className="form-actions">
            <button className="secondary-button" type="button" onClick={onHome}>
              홈
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={onOnboarding}
            >
              온보딩 설정
            </button>
            <button
              className="primary-button"
              type="button"
              onClick={save}
              disabled={isSaving}
            >
              {isSaving ? "저장 중" : "프로필 저장"}
            </button>
          </div>
        </>
      )}
    </section>
  );
}

function ProfileSnapshot({ profile }: { profile: SavedProfile }) {
  return (
    <article className="profile-snapshot">
      <div className="snapshot-head">
        <span className="badge signal">저장 완료</span>
        <strong>내 프로필</strong>
        <small>
          {profile.updatedAt
            ? `최근 저장 ${profile.updatedAt.slice(0, 10)}`
            : "저장된 지원 자료"}
        </small>
      </div>
      <h3>{profile.name}</h3>
      <p>{profile.headline}</p>
      <div className="snapshot-grid" aria-label="저장된 프로필 요약">
        <span>
          <small>희망 직무</small>
          <strong>{profile.targetRoles || "미입력"}</strong>
        </span>
        <span>
          <small>분야·경력</small>
          <strong>
            {profile.field} · {profile.career}
          </strong>
        </span>
        <span>
          <small>이력서</small>
          <strong>{profile.resumeFileName || "텍스트 요약 저장"}</strong>
        </span>
        <span>
          <small>포트폴리오</small>
          <strong>{profile.portfolioFileName || "텍스트 요약 저장"}</strong>
        </span>
      </div>
      <div className="snapshot-preferences">
        <small>선호 산업</small>
        <strong>{profile.preferences || "지원 방향 미입력"}</strong>
      </div>
    </article>
  );
}

function fallbackRecommendations(profile: SavedProfile = defaultProfile): RecommendationResult {
  const profileText = [
    profile.headline,
    profile.targetRoles,
    profile.preferences,
    profile.resumeText,
    profile.portfolioText,
  ].join(" ");
  const isBrand =
    profileText.includes("브랜드") ||
    profileText.includes("BX") ||
    profileText.includes("아이덴티티");
  const isProduct =
    profileText.includes("UI") ||
    profileText.includes("UX") ||
    profileText.includes("프로덕트");
  const isRetail =
    profileText.includes("리테일") || profileText.includes("고객 접점");

  return {
    profileSummary: `${profile.name || "지원자"}님의 프로필은 ${profile.career} 경력의 ${profile.field} 기반 지원자로, ${profile.targetRoles || "브랜드·프로덕트 직무"} 방향에 맞춰 정리했습니다.`,
    jobs: [
      {
        company: "Mori Labs",
        role: isBrand ? "브랜드 경험 디자이너" : "콘텐츠 경험 디자이너",
        fitScore: isBrand ? 86 : 78,
        why: "브랜드 방향성을 고객 접점과 산출물로 확장한 사례를 보여주기 좋은 공고 유형입니다.",
        matchingSignals: [
          "브랜드 시스템",
          isRetail ? "리테일 접점" : "고객 경험",
          "포트폴리오 서사",
        ],
        portfolioFocus:
          "첫 프로젝트에 브랜드 방향, 본인 역할, 실행 결과를 한 화면에 묶어 보여주세요.",
        firstAction: "가장 브랜드성이 강한 프로젝트를 첫 번째로 배치하세요.",
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

function SuggestionScreen({
  onProfile,
  onNew,
}: {
  onProfile: () => void;
  onNew: () => void;
}) {
  const [recommendations, setRecommendations] =
    useState<RecommendationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const loadRecommendations = async () => {
    setIsLoading(true);
    setError("");
    setRecommendations(null);

    try {
      const response = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        throw new Error("recommendation_response_not_json");
      }

      const payload = (await response.json()) as {
        recommendations?: RecommendationResult;
        error?: string;
      };

      if (!response.ok || !payload.recommendations) {
        throw new Error(payload.error || "맞춤공고 추천을 받지 못했습니다.");
      }

      setRecommendations(payload.recommendations);
    } catch {
      setRecommendations(fallbackRecommendations());
      setError("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="screen">
      <StepHeader label="맞춤공고" title="내 프로필 기반 제안" />
      <div className="section-band-stack">
        <section className="section-band">
          <article className="guided-card">
            <div>
              <span className="badge signal">추천</span>
              <h3>저장된 이력서와 포트폴리오를 바탕으로 제안합니다</h3>
              <p>
                희망 직무, 선호 산업, 프로젝트 근거를 함께 읽고 지금 지원해볼 만한
                방향을 정리합니다.
              </p>
            </div>
            <button
              className="primary-button"
              type="button"
              onClick={loadRecommendations}
              disabled={isLoading}
            >
              {isLoading ? "추천 생성 중" : "맞춤공고 추천 받기"}
            </button>
          </article>
        </section>

        {error && (
          <section className="section-band">
            <div className="analysis-placeholder is-warning">
              <strong>추천글을 만들지 못했습니다.</strong>
              <span>{error}</span>
            </div>
          </section>
        )}

        {recommendations && (
          <section className="section-band">
            <div className="content-stack">
              <article className="data-card">
                <span className="badge signal">프로필 요약</span>
                <h3>{recommendations.profileSummary}</h3>
              </article>
              {recommendations.jobs.map((job) => (
                <article className="job-suggestion-card" key={`${job.company}-${job.role}`}>
                  <div className="card-topline">
                    <span className="badge">핏 {Math.round(job.fitScore)}</span>
                    <span>{job.company}</span>
                  </div>
                  <h3>{job.role}</h3>
                  <p>{job.why}</p>
                  <div className="tag-row">
                    {job.matchingSignals.map((signal) => (
                      <span key={signal}>{signal}</span>
                    ))}
                  </div>
                  <strong>{job.portfolioFocus}</strong>
                  <button className="inline-evidence" type="button" onClick={onNew}>
                    이 공고로 분석 시작
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="form-actions">
        <button className="secondary-button" type="button" onClick={onProfile}>
          프로필 수정
        </button>
        <button className="primary-button" type="button" onClick={onNew}>
          새 공고 분석
        </button>
      </div>
    </section>
  );
}

function AnalysesScreen({
  onResult,
  onNew,
}: {
  onResult: () => void;
  onNew: () => void;
}) {
  return (
    <section className="screen analyses-screen">
      <StepHeader label="분석" title="지원 및 분석목록" />
      <div className="section-band-stack">
        <section className="section-band">
          <SectionTitle
            title="지원 폴더"
            subtitle="폴더를 열면 상세 분석 결과가 이어집니다."
          />
          <AnalysisList onResult={onResult} onNew={onNew} />
        </section>
      </div>
    </section>
  );
}

function AnalysisList({
  onResult,
  onNew,
}: {
  onResult: () => void;
  onNew: () => void;
}) {
  return (
    <div className="analysis-list" aria-label="지원 및 분석 폴더">
      <button className="analysis-folder-card" type="button" onClick={onResult}>
        <span className="folder-icon" aria-hidden="true">
          <span />
        </span>
        <span className="folder-content">
          <span className="card-topline">
            <span>최근 분석</span>
            <span>문구수정 1곳</span>
          </span>
          <strong>{sampleAnalysis.company}</strong>
          <small>{sampleAnalysis.role} · 포트폴리오 PDF 연결</small>
          <span className="folder-tags">
            <span>요약</span>
            <span>페이지</span>
            <span>면접질문</span>
          </span>
        </span>
      </button>
      <button className="analysis-folder-card empty" type="button" onClick={onNew}>
        <span className="folder-icon" aria-hidden="true">
          <span />
        </span>
        <span className="folder-content">
          <span className="card-topline">
            <span>새 지원</span>
            <span>준비 전</span>
          </span>
          <strong>다른 지원 공고 분석</strong>
          <small>기업명, 공고 링크, 포트폴리오 파일로 새 폴더를 만듭니다.</small>
        </span>
      </button>
    </div>
  );
}

function ReviewTimeline({ status }: { status: ReviewStatus }) {
  return (
    <div className="timeline">
      {reviewTimeline.map((item) => (
        <div
          key={item.key}
          className={statusReached(status, item.key) ? "is-active" : ""}
        >
          <span />
          {item.label}
        </div>
      ))}
    </div>
  );
}

function BottomTabs({
  view,
  onGo,
}: {
  view: AppView;
  onGo: (view: AppView) => void;
}) {
  if (view === "welcome" || view === "onboarding") return null;

  return (
    <nav className="bottom-tabs" aria-label="주요 탭">
      <TabButton
        icon="home"
        label="홈"
        isActive={view === "home"}
        onClick={() => onGo("home")}
      />
      <TabButton
        icon="analysis"
        label="분석"
        isActive={view === "analyses" || view === "result"}
        onClick={() => onGo("analyses")}
      />
      <TabButton
        icon="suggestions"
        label="추천"
        isActive={view === "suggestions"}
        onClick={() => onGo("suggestions")}
      />
      <TabButton
        icon="profile"
        label="프로필"
        isActive={view === "profile"}
        onClick={() => onGo("profile")}
      />
    </nav>
  );
}

type TabIconName =
  | "home"
  | "analysis"
  | "suggestions"
  | "profile"
  | "assign"
  | "request"
  | "review"
  | "exit";

function TabButton({
  icon,
  label,
  isActive = false,
  onClick,
}: {
  icon: TabIconName;
  label: string;
  isActive?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={isActive ? "is-active" : ""}
      type="button"
      onClick={onClick}
    >
      <TabIcon name={icon} />
      <span>{label}</span>
    </button>
  );
}

function TabIcon({ name }: { name: TabIconName }) {
  const paths: Record<TabIconName, string[]> = {
    home: ["M3 10.5 12 3l9 7.5", "M5.5 9.5V21h13V9.5", "M9.5 21v-6h5v6"],
    analysis: ["M5 19V9", "M12 19V5", "M19 19v-7", "M4 21h16"],
    suggestions: ["M12 3v4", "M12 17v4", "M4.2 7.2l2.8 2.8", "M17 14l2.8 2.8", "M3 12h4", "M17 12h4", "M8 12a4 4 0 1 0 8 0 4 4 0 0 0-8 0Z"],
    profile: [
      "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
      "M5 21a7 7 0 0 1 14 0",
    ],
    assign: ["M6 4h12v17H6z", "M9 8h6", "M9 12h6", "M9 16h4"],
    request: ["M5 5h14v12H8l-3 3z", "M9 9h6", "M9 13h4"],
    review: ["M4 12h4l3 7 4-14 2 7h3", "M4 21h16"],
    exit: ["M5 4h8v16H5z", "M13 12h8", "m18 9 3 3-3 3"],
  };

  return (
    <svg
      aria-hidden="true"
      className="tab-icon"
      fill="none"
      viewBox="0 0 24 24"
    >
      {paths[name].map((path) => (
        <path key={path} d={path} />
      ))}
    </svg>
  );
}

function StepHeader({ label, title }: { label: string; title: string }) {
  return (
    <div className="step-header">
      <span>{label}</span>
      <h2>{title}</h2>
    </div>
  );
}

function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="section-title">
      <h3>{title}</h3>
      {subtitle && <p>{subtitle}</p>}
    </div>
  );
}

function InfoLine({ label, text }: { label: string; text: string }) {
  return (
    <div className="info-line">
      <span>{label}</span>
      <strong>{text}</strong>
    </div>
  );
}

function EvidenceSnippet({
  label,
  text,
  evidence,
  onClick,
}: {
  label: string;
  text: string;
  evidence?: EvidenceDetail;
  onClick: (evidence: EvidenceDetail) => void;
}) {
  return (
    <button
      className="evidence-snippet"
      type="button"
      onClick={() =>
        onClick(
          evidence ??
            evidenceDetail({
              title: label,
              source: "자동 분석",
              excerpt: text,
              reason: "해당 화면의 판단에 사용된 요약 근거입니다.",
              confidence: "중간",
            }),
        )
      }
    >
      <span>{label}</span>
      <strong>{text}</strong>
    </button>
  );
}

function EvidenceSheet({
  evidence,
  onClose,
  onCopy,
}: {
  evidence: EvidenceDetail | null;
  onClose: () => void;
  onCopy: (text: string) => void;
}) {
  if (!evidence) return null;

  const copyText = [
    evidence.title,
    `[${evidence.source}] ${evidence.excerpt}`,
    evidence.reason,
    evidence.nextAction ? `추천 행동: ${evidence.nextAction}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div className="evidence-backdrop" role="presentation" onClick={onClose}>
      <section
        className="evidence-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="evidence-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sheet-handle" aria-hidden="true" />
        <div className="sheet-header">
          <div>
            <span className="badge signal">{evidence.source}</span>
            <h2 id="evidence-title">{evidence.title}</h2>
          </div>
          <button type="button" aria-label="근거 창 닫기" onClick={onClose}>
            닫기
          </button>
        </div>

        <div className="evidence-quote">
          <span>발췌</span>
          <p>{evidence.excerpt}</p>
        </div>

        <div className="sheet-grid">
          {evidence.page && <InfoLine label="페이지" text={evidence.page} />}
          {evidence.project && <InfoLine label="프로젝트" text={evidence.project} />}
          {evidence.confidence && (
            <InfoLine label="신뢰도" text={evidence.confidence} />
          )}
        </div>

        <div className="sheet-section">
          <h3>판단 이유</h3>
          <p>{evidence.reason}</p>
        </div>

        {evidence.nextAction && (
          <div className="sheet-section action">
            <h3>추천 행동</h3>
            <p>{evidence.nextAction}</p>
          </div>
        )}

        <div className="sheet-actions">
          <button
            className="secondary-button"
            type="button"
            onClick={() => onCopy(copyText)}
          >
            근거 복사
          </button>
          <button className="primary-button" type="button" onClick={onClose}>
            확인
          </button>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-card">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}
