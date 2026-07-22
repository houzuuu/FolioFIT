import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the FOLIOFIT welcome experience", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>FOLIOFIT<\/title>/i);
  assert.match(html, /내 포트폴리오가/);
  assert.match(html, /이 회사에 어떻게 보일까요/);
  assert.match(html, /포트폴리오 분석 \+ 맞춤공고 추천/);
  assert.match(html, /직무 적합도와 증거 전달력|합격 확률 표시 없음/);
  assert.doesNotMatch(html, /Your site is taking shape|Building your site/);
  assert.doesNotMatch(html, /react-loading-skeleton|codex-preview/);
});

test("keeps the product shell, product flows, and starter cleanup in source", async () => {
  const [page, layout, css, packageJson, appIcon, appEntries, hosting, migration] =
    await Promise.all([
      readFile(new URL("app/page.tsx", root), "utf8"),
      readFile(new URL("app/layout.tsx", root), "utf8"),
      readFile(new URL("app/globals.css", root), "utf8"),
      readFile(new URL("package.json", root), "utf8"),
      readFile(new URL("public/app-icon.png", root)),
      readdir(new URL("app", root)),
      readFile(new URL(".openai/hosting.json", root), "utf8"),
      readFile(new URL("drizzle/0000_cold_blindfold.sql", root), "utf8"),
    ]);

  assert.match(layout, /const title = "FOLIOFIT"/);
  assert.match(layout, /\/og\.png/);
  assert.match(layout, /\/app-icon\.png/);
  assert.doesNotMatch(layout, /\/favicon\.svg/);
  assert.match(layout, /lang="ko"/);
  assert.match(css, /max-width:\s*480px/);
  assert.match(css, /100dvh/);
  assert.match(css, /#eef1f5/i);
  assert.match(css, /--primary:\s*#6258ff/i);
  assert.match(css, /--signal:\s*#c8ff5a/i);
  assert.match(css, /brand-folio/);
  assert.match(css, /brand-fit-line/);
  assert.match(css, /url\("\/app-icon\.png"\)/);
  assert.match(css, /score-panel/);
  assert.match(css, /strength-list/);
  assert.match(css, /dimension-list/);
  assert.match(css, /form-actions\.single-action/);
  assert.equal(appIcon.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  assert.ok(appIcon.length > 50000);
  assert.match(css, /scrollbar-width:\s*none/);
  assert.match(page, /실제 채용 결과를 예측하지 않습니다/);
  assert.match(page, /생성일/);
  assert.match(page, /자료 보강이 필요한 부분/);
  assert.match(page, /근거 복사/);
  assert.match(page, /추천 흐름/);
  assert.match(page, /공고 분석 시작/);
  assert.match(page, /종합 분석하기/);
  assert.match(page, /분석글로 정리했어요/);
  assert.match(page, /공고 링크/);
  assert.match(page, /이 분석을 공고 정보에 반영/);
  assert.match(page, /처음엔 이것만 보세요/);
  assert.match(page, /내 지원 자료 저장/);
  assert.match(page, /맞춤공고 추천 받기/);
  assert.match(page, /title: "개발"/);
  assert.match(page, /frontend/);
  assert.match(page, /DevOps·클라우드/);
  assert.match(page, /motion_interaction/);
  assert.doesNotMatch(page, /<span className="brand-mark">F<\/span>/);
  assert.doesNotMatch(page, /Mascot|mascot/);
  assert.match(page, /main-field-grid/);
  assert.match(page, /main-field-card/);
  assert.match(page, /세부 지원맥락/);
  assert.match(page, /중복 선택 가능/);
  assert.match(page, /selectedSpecialtyText/);
  assert.match(page, /프로필 세부직무 중복 선택/);
  assert.match(page, /isProfileEditing/);
  assert.match(page, /profile-view-stack/);
  assert.match(page, /single-action/);
  assert.match(page, /온보딩 설정/);
  assert.doesNotMatch(page, /specialty === item/);
  assert.match(page, /지원 및 분석목록/);
  assert.match(page, /score-panel strength-panel/);
  assert.match(page, /score-panel dimension-panel/);
  assert.match(page, /analysis-folder-card/);
  assert.match(page, /저장 완료/);
  assert.match(page, /수정 위치 p\./);
  assert.doesNotMatch(page, /InfoLine label="핏 점수"/);
  assert.doesNotMatch(page, /<p>{item\.why}<\/p>|<strong>{item\.framework}<\/strong>/);
  assert.doesNotMatch(page, /데모/);
  assert.match(page, /section-band-stack/);
  assert.match(page, /home-section-stack/);
  assert.match(page, /result-actions/);
  assert.doesNotMatch(page, /OPENAI_API_KEY|실제 AI 분석|AI 분석 엔진 연결/);
  assert.match(page, /tab-icon/);
  assert.match(hosting, /"d1":\s*"DB"/);
  assert.match(migration, /CREATE TABLE `profiles`/);
  assert.doesNotMatch(page, /Generated |Missing proof|Good foundation|Before|After/);
  assert.doesNotMatch(page, /SkeletonPreview|_sites-preview/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.deepEqual(
    appEntries.filter((entry) => entry === "_sites-preview"),
    [],
  );
});
