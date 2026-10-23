import assert from "node:assert/strict"
import { test } from "node:test"
import {
  EMPTY_DRAFT, buildTiles, checkDraft, choiceNote, dayLabel, filterTiles, frontPosition, nextPosition, playsHere, seconds, slotCount,
  videoKey, videoRef, type AthleteVideo, type Material, type MatchVideo,
} from "./model.ts"

const YT = "aqz-KE-bpKQ"

test("YouTube: os jeitos de colar viram o mesmo vídeo, com miniatura e player embutido", () => {
  const forms = [
    `https://www.youtube.com/watch?v=${YT}`,
    `https://youtube.com/watch?v=${YT}&feature=share`,
    `https://m.youtube.com/watch?v=${YT}`,
    `https://youtu.be/${YT}?si=abc`,
    `https://www.youtube.com/shorts/${YT}`,
    `https://www.youtube.com/embed/${YT}`,
    `https://www.youtube-nocookie.com/embed/${YT}`,
    `  https://www.youtube.com/live/${YT}  `,
  ]
  for (const f of forms) {
    const r = videoRef(f)
    assert.ok(r, f)
    assert.equal(r.provider, "youtube", f)
    assert.equal(r.id, YT, f)
    assert.equal(r.url, `https://www.youtube.com/watch?v=${YT}`, f)
    assert.equal(r.thumb, `https://i.ytimg.com/vi/${YT}/hqdefault.jpg`)
    assert.match(r.embed ?? "", /^https:\/\/www\.youtube-nocookie\.com\/embed\/aqz-KE-bpKQ\?autoplay=1/)
  }
  assert.equal(new Set(forms.map((f) => videoKey(videoRef(f)!))).size, 1)
})

test("YouTube: o tempo de início é mantido (t= e start=)", () => {
  const r = videoRef(`https://youtu.be/${YT}?t=1m30s`)!
  assert.equal(r.url, `https://www.youtube.com/watch?v=${YT}&t=90s`)
  assert.match(r.embed!, /&start=90$/)
  assert.equal(seconds("150"), 150)
  assert.equal(seconds("150s"), 150)
  assert.equal(seconds("1h2m3s"), 3723)
  assert.equal(seconds("abc"), 0)
  assert.equal(seconds(null), 0)
  assert.equal(videoKey(r), videoKey(videoRef(`https://www.youtube.com/watch?v=${YT}`)!), "o mesmo vídeo, mesmo começando em outro ponto")
})

test("YouTube sem id de vídeo (canal, lista) vira link comum", () => {
  const r = videoRef("https://www.youtube.com/@zyron")!
  assert.equal(r.provider, "link")
  assert.equal(r.embed, null)
})

test("Vimeo, Google Drive e arquivo de vídeo tocam aqui; Instagram e TikTok abrem no site", () => {
  const v = videoRef("https://vimeo.com/123456789")!
  assert.deepEqual([v.provider, v.id, v.url], ["vimeo", "123456789", "https://vimeo.com/123456789"])
  assert.equal(v.embed, "https://player.vimeo.com/video/123456789?autoplay=1&dnt=1")
  const vp = videoRef("https://vimeo.com/123456789/abc123def")!
  assert.equal(vp.embed, "https://player.vimeo.com/video/123456789?autoplay=1&dnt=1&h=abc123def", "link privado leva o código")
  assert.equal(videoRef("https://player.vimeo.com/video/123456789")!.id, "123456789")

  const d = videoRef("https://drive.google.com/file/d/1AbC_dEf-GhIjKlMn/view?usp=sharing")!
  assert.deepEqual([d.provider, d.id], ["drive", "1AbC_dEf-GhIjKlMn"])
  assert.equal(d.url, "https://drive.google.com/file/d/1AbC_dEf-GhIjKlMn/view")
  assert.equal(d.embed, "https://drive.google.com/file/d/1AbC_dEf-GhIjKlMn/preview")
  assert.equal(videoRef("https://drive.google.com/open?id=1AbC_dEf-GhIjKlMn")!.id, "1AbC_dEf-GhIjKlMn")

  const f = videoRef("https://exemplo.com.br/videos/gol.mp4")!
  assert.equal(f.provider, "arquivo")
  assert.equal(f.embed, "https://exemplo.com.br/videos/gol.mp4")

  const ig = videoRef("https://www.instagram.com/reel/C9xYz12AbCd/?igsh=1")!
  assert.equal(ig.provider, "instagram")
  assert.equal(ig.embed, null)
  assert.equal(playsHere(ig), false)
  assert.equal(videoRef("https://www.tiktok.com/@atleta/video/7312345678901234567")!.provider, "tiktok")
  assert.equal(videoRef("https://vm.tiktok.com/ZMabc123/")!.provider, "tiktok")

  const site = videoRef("https://www.clube.com.br/peneira?id=3#topo")!
  assert.deepEqual([site.provider, site.host, site.url], ["link", "clube.com.br", "https://www.clube.com.br/peneira?id=3"])
})

test("só https e endereço de verdade", () => {
  for (const bad of ["", "   ", "youtube.com/watch?v=aqz-KE-bpKQ", "http://youtu.be/aqz-KE-bpKQ", "javascript:alert(1)", "https://localhost/video",
    "https://user:senha@site.com/v", "ftp://site.com/v.mp4", `https://site.com/${"a".repeat(600)}`]) {
    assert.equal(videoRef(bad), null, bad)
  }
})

const material = (p: Partial<Material> = {}): Material => ({
  id: p.id ?? "m1", playerKey: "lead:00000000-0000-0000-0000-000000000001", url: `https://www.youtube.com/watch?v=${YT}`, title: null,
  category: "lances", recordedOn: null, position: 0, createdBy: null, createdAt: "2026-10-20T12:00:00Z", updatedAt: "2026-10-20T12:00:00Z", ...p,
})

test("conferir o que foi preenchido: link, repetido, título e data", () => {
  const today = new Date(2026, 9, 23)
  const ok = checkDraft({ ...EMPTY_DRAFT, url: `https://youtu.be/${YT}`, title: "  Melhores   lances  ", recordedOn: "2026-10-20" }, [], today)
  assert.ok("value" in ok)
  assert.deepEqual(ok.value, { url: `https://www.youtube.com/watch?v=${YT}`, title: "Melhores lances", category: "lances", recordedOn: "2026-10-20" })

  const empty = checkDraft({ ...EMPTY_DRAFT }, [], today)
  assert.ok("error" in empty && /Cole o link/.test(empty.error))
  const bad = checkDraft({ ...EMPTY_DRAFT, url: "youtube.com/xyz" }, [], today)
  assert.ok("error" in bad && /https/.test(bad.error))
  const dup = checkDraft({ ...EMPTY_DRAFT, url: `https://www.youtube.com/shorts/${YT}` }, [material()], today)
  assert.ok("error" in dup && /já está/.test(dup.error), "o mesmo vídeo colado de outro jeito é repetido")
  const long = checkDraft({ ...EMPTY_DRAFT, url: `https://youtu.be/${YT}`, title: "x".repeat(81) }, [], today)
  assert.ok("error" in long && /80/.test(long.error))
  for (const day of ["2026-13-01", "1999-12-31", "2026-10-30", "ontem"]) {
    const r = checkDraft({ ...EMPTY_DRAFT, url: `https://youtu.be/${YT}`, recordedOn: day }, [], today)
    assert.ok("error" in r && /data/.test(r.error), day)
  }
  const noTitle = checkDraft({ ...EMPTY_DRAFT, url: `https://youtu.be/${YT}`, title: "   " }, [], today)
  assert.ok("value" in noTitle && noTitle.value.title === null)
})

test("ordem dos quadrados: colocar vai para o fim; destacar vai para a frente", () => {
  assert.equal(nextPosition([]), 0)
  assert.equal(frontPosition([]), 0)
  const list = [material({ position: 3 }), material({ position: -1 }), material({ position: 7 })]
  assert.equal(nextPosition(list), 8)
  assert.equal(frontPosition(list), -2)
})

const sent = (p: Partial<AthleteVideo> = {}): AthleteVideo => ({
  id: "s1", videoId: "M7lc1UVf-VE", opponent: "Gama Sub-17", playedOn: "2026-10-10", status: "em_analise", matchId: null, createdAt: "2026-10-11T12:00:00Z", ...p,
})
const match = (p: Partial<MatchVideo> = {}): MatchVideo => ({
  id: "p1", memberId: "mem1", url: "https://youtu.be/jNQXAC9IVRw", team: "Joinville Sub-17", opponent: "Avaí Sub-17", competition: "Catarinense", playedOn: "2026-10-05", published: true, ...p,
})

test("os quadrados: equipe primeiro (na ordem dela), depois partidas e envios do atleta, sem repetir vídeo", () => {
  const tiles = buildTiles(
    [material({ id: "b", position: 2, title: "Gols 2026", category: "gols" }), material({ id: "a", position: 1, url: "https://vimeo.com/123456789", recordedOn: "2026-09-01" })],
    [match(), match({ id: "p2", url: "http://inseguro.com/v.mp4" })],
    [sent(), sent({ id: "s2", videoId: YT, opponent: null }), sent({ id: "s3", videoId: "jNQXAC9IVRw", matchId: "p1" })],
  )
  assert.deepEqual(tiles.map((t) => t.key), ["equipe:a", "equipe:b", "partida:p1", "atleta:s1"])
  const [a, b, p, s] = tiles
  assert.equal(a.title, "Melhores lances", "sem título, vale o tipo")
  assert.deepEqual(a.meta, ["Melhores lances", "01/09/2026"])
  assert.equal(b.title, "Gols 2026")
  assert.equal(p.title, "Joinville Sub-17 × Avaí Sub-17")
  assert.deepEqual(p.meta, ["Catarinense", "05/10/2026"])
  assert.equal(s.title, "Jogo contra Gama Sub-17")
  assert.deepEqual(s.meta, ["Em análise", "10/10/2026"])
  assert.equal(tiles.some((t) => t.key === "atleta:s2"), false, "o envio com o mesmo vídeo da equipe não repete")
  assert.equal(tiles.some((t) => t.key === "atleta:s3"), false, "o envio que virou partida aparece como a partida")
  assert.equal(tiles.some((t) => t.key === "partida:p2"), false, "link inseguro fica de fora")
  assert.deepEqual(filterTiles(tiles, "equipe").map((t) => t.key), ["equipe:a", "equipe:b"])
  assert.deepEqual(filterTiles(tiles, "todos"), tiles)
})

test("partida em rascunho e envio sem adversário têm rótulo próprio", () => {
  const [p, s] = buildTiles([], [match({ published: false, competition: null })], [sent({ opponent: null, playedOn: null })])
  assert.deepEqual(p.meta, ["Partida analisada", "05/10/2026", "Rascunho"])
  assert.equal(s.title, "Jogo enviado pelo atleta")
  assert.deepEqual(s.meta, ["Em análise"])
  assert.equal(s.date, "2026-10-11")
})

test("quantos quadrados: duas fileiras no mínimo, fileiras cheias, sempre um livre para quem pode colocar", () => {
  assert.equal(slotCount(0, true), 8)
  assert.equal(slotCount(7, true), 8)
  assert.equal(slotCount(8, true), 12, "8 cheios: abre mais uma fileira para o próximo")
  assert.equal(slotCount(8, false), 8, "quem só olha não ganha quadrado livre a mais")
  assert.equal(slotCount(13, true), 16)
  assert.equal(slotCount(3, true, 4, 4), 4)
})

test("datas e quem escolheu a foto, em português", () => {
  assert.equal(dayLabel("2026-10-23"), "23/10/2026")
  assert.equal(dayLabel("2026-10-23T15:00:00Z"), "23/10/2026")
  assert.equal(dayLabel(null), "")
  assert.equal(dayLabel("ontem"), "")
  assert.equal(choiceNote(null, null), "")
  assert.equal(choiceNote("atleta", new Date(2026, 9, 23, 15).toISOString()), "Escolha do atleta em 23/10/2026")
  assert.equal(choiceNote("equipe", null), "Escolha da equipe")
})
