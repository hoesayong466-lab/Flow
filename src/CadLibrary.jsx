import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Box,
  Boxes,
  Download,
  ExternalLink,
  FileText,
  LoaderCircle,
  RotateCcw,
  Search,
  X,
} from 'lucide-react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ThreeMFLoader } from 'three/addons/loaders/3MFLoader.js';

const filters = [
  { id: 'all', label: '전체' },
  { id: 'assembly', label: '조립품' },
  { id: 'part', label: '부품' },
  { id: 'drawing', label: '2D 도면' },
];

const kindLabel = {
  assembly: '조립품',
  part: '부품',
  drawing: '2D 도면',
};

function formatSize(bytes = 0) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${bytes} B`;
}

export default function CadLibrary({ orders = [] }) {
  const [manifest, setManifest] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let active = true;
    fetch('/cad-assets/manifest.json')
      .then((response) => {
        if (!response.ok) throw new Error('도면 목록을 불러오지 못했습니다.');
        return response.json();
      })
      .then((data) => { if (active) setManifest(data); })
      .catch((error) => { if (active) setLoadError(error.message); });
    return () => { active = false; };
  }, []);

  const items = manifest?.items ?? [];
  const counts = useMemo(() => items.reduce((acc, item) => {
    acc[item.kind] = (acc[item.kind] ?? 0) + 1;
    if (item.status === 'warning') acc.warnings += 1;
    if (item.status === 'ready' || item.status === 'warning') acc.ready += 1;
    return acc;
  }, { assembly: 0, part: 0, drawing: 0, warnings: 0, ready: 0 }), [items]);

  const mainAssembly = items.find((item) => item.kind === 'assembly' && item.name === 'Luna Lever 치수 Vision 검사 설비');
  const visibleItems = useMemo(() => items
    .filter((item) => filter === 'all' || item.kind === filter)
    .filter((item) => `${item.name} ${item.sourceName} ${kindLabel[item.kind]}`.toLowerCase().includes(query.trim().toLowerCase()))
    .filter((item) => !(filter === 'all' && !query.trim() && item.id === mainAssembly?.id)), [items, filter, query, mainAssembly?.id]);

  return (
    <div className="cad-library">
      <header className="cad-library-heading">
        <div>
          <span className="cad-eyebrow">설계 자료</span>
          <h2>도면과 3D 모델</h2>
          <p>프로젝트에 연결된 SolidWorks 자료를 웹에서 바로 살펴봅니다.</p>
        </div>
        <div className="cad-library-meta"><span className="cad-live-dot" />웹 미리보기 준비 {counts.ready} / {items.length}</div>
      </header>

      {counts.warnings > 0 && (
        <div className="cad-reference-note">
          <AlertTriangle size={17} />
          <span>{items.filter((item) => item.status === 'warning').map((item) => item.warningDetail || `${item.name}: 참조 파일 확인 필요`).join(' · ')}</span>
          <strong>참조 확인 {counts.warnings}건</strong>
        </div>
      )}

      <div className="cad-summary-grid">
        <SummaryCard icon={<Boxes size={17} />} label="설계 파일" value={items.length} unit="개" detail="웹 미리보기로 열기" tone="violet" />
        <SummaryCard icon={<Boxes size={17} />} label="조립품" value={counts.assembly} unit="개" detail="3D 회전 보기" tone="blue" />
        <SummaryCard icon={<Box size={17} />} label="개별 부품" value={counts.part} unit="개" detail="3D 회전 보기" tone="amber" />
        <SummaryCard icon={<FileText size={17} />} label="도면" value={counts.drawing} unit="장" detail="PDF 확대 보기" tone="green" />
      </div>

      {loadError && <div className="cad-load-error"><AlertTriangle size={16} />{loadError}</div>}

      {mainAssembly && filter === 'all' && !query.trim() && (
        <section className="cad-featured">
          <div className="cad-featured-art"><div className="cad-featured-orbit orbit-one" /><div className="cad-featured-orbit orbit-two" /><div className="cad-featured-cube"><Boxes size={41} strokeWidth={1.4} /></div><span className="cad-art-tag">3D ASSEMBLY</span></div>
          <div className="cad-featured-copy">
            <div className="cad-featured-kicker"><span>메인 조립품</span><span className={mainAssembly.status === 'warning' ? 'cad-state warning' : 'cad-state'}>{mainAssembly.status === 'warning' ? '참조 확인' : '미리보기 준비'}</span></div>
            <h3>{mainAssembly.name}</h3>
            <p>{mainAssembly.warningDetail ? `${mainAssembly.warningDetail} · 3D 화면을 회전하고 확대해 설비를 확인할 수 있습니다.` : '회전하고 확대해 전체 설비 배치를 확인하세요. 화면을 드래그하면 각도를 바꿀 수 있습니다.'}</p>
            <div className="cad-featured-actions"><button className="button primary" onClick={() => setSelected(mainAssembly)}><Box size={15} />3D로 보기<ArrowUpRight size={14} /></button><span>{formatSize(mainAssembly.bytes)} · 3MF</span></div>
          </div>
        </section>
      )}

      <div className="cad-toolbar">
        <div className="cad-filter-tabs" role="tablist" aria-label="자료 종류">
          {filters.map((item) => <button key={item.id} className={filter === item.id ? 'active' : ''} onClick={() => setFilter(item.id)}>{item.label}<span>{item.id === 'all' ? items.length : counts[item.id]}</span></button>)}
        </div>
        <label className="cad-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="파일명 검색" aria-label="도면과 모델 검색" /></label>
      </div>

      {!manifest && !loadError && <div className="cad-loading"><LoaderCircle size={18} className="cad-spinner" />SolidWorks 자료 목록을 불러오는 중입니다.</div>}
      {manifest && visibleItems.length === 0 && <div className="cad-empty">조건에 맞는 파일이 없습니다.</div>}
      {manifest && visibleItems.length > 0 && (
        <div className="cad-file-grid">
          {visibleItems.map((item) => <CadFileCard key={item.id} item={item} onOpen={() => setSelected(item)} />)}
        </div>
      )}

      {orders.length > 0 && (
        <section className="cad-order-files">
          <div className="cad-order-heading"><div><span className="cad-eyebrow">함께 보는 문서</span><h3>발주 파일</h3></div><span>{orders.length}건</span></div>
          <div className="cad-order-list">{orders.map((order) => <div className="cad-order-row" key={order.id}><span className="cad-order-file-icon"><FileText size={16} /></span><div><strong>{order.file || `${order.id}_${order.item}.xlsx`}</strong><small>{order.id} · {order.vendor} · {order.item}</small></div><span className="cad-order-status">{order.status}</span></div>)}</div>
        </section>
      )}

      {selected && <CadPreview item={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function SummaryCard({ icon, label, value, unit, detail, tone }) {
  return <article className={`cad-summary-card tone-${tone}`}><span className="cad-summary-icon">{icon}</span><span className="cad-summary-label">{label}</span><strong>{value}<small>{unit}</small></strong><span className="cad-summary-detail">{detail}</span></article>;
}

function CadFileCard({ item, onOpen }) {
  const icon = item.kind === 'drawing' ? <FileText size={18} /> : item.kind === 'assembly' ? <Boxes size={18} /> : <Box size={18} />;
  const state = item.status === 'ready' ? '미리보기 준비' : item.status === 'warning' ? '참조 확인' : '변환 확인';
  return (
    <button className="cad-file-card" onClick={onOpen}>
      <span className={`cad-file-icon cad-${item.kind}`}>{icon}</span>
      <span className="cad-file-main"><span className="cad-file-kicker">{kindLabel[item.kind]}{item.kind !== 'drawing' ? ' · 3MF' : ' · PDF'}</span><strong title={item.name}>{item.name}</strong><small title={item.sourceName}>{item.sourceName}</small></span>
      <span className="cad-file-card-footer"><span className={item.status === 'warning' ? 'cad-file-state warning' : 'cad-file-state'}>{item.status === 'warning' && <AlertTriangle size={12} />}{state}</span><span>{formatSize(item.bytes)}</span><ArrowUpRight size={15} className="cad-file-open" /></span>
    </button>
  );
}

function CadPreview({ item, onClose }) {
  useEffect(() => {
    const handleKey = (event) => { if (event.key === 'Escape') onClose(); };
    const priorOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKey);
    return () => { document.body.style.overflow = priorOverflow; window.removeEventListener('keydown', handleKey); };
  }, [onClose]);

  return (
    <div className="cad-preview-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className={`cad-preview-modal ${item.kind === 'drawing' ? 'drawing-preview' : ''}`} role="dialog" aria-modal="true" aria-label={`${item.name} 미리보기`}>
        <header className="cad-preview-header"><div className="cad-preview-file-icon">{item.kind === 'drawing' ? <FileText size={18} /> : <Boxes size={18} />}</div><div className="cad-preview-title"><strong>{item.name}</strong><span>{kindLabel[item.kind]} · {item.sourceName}</span></div><div className="cad-preview-actions"><a href={item.asset} target="_blank" rel="noreferrer" aria-label="새 탭에서 열기"><ExternalLink size={17} /></a><a href={item.asset} download aria-label="파일 다운로드"><Download size={17} /></a><button onClick={onClose} aria-label="미리보기 닫기"><X size={19} /></button></div></header>
        {item.kind === 'drawing' ? <DrawingPreview item={item} /> : <ModelViewport item={item} />}
        <footer className="cad-preview-footer"><span>{item.status === 'warning' ? <><AlertTriangle size={14} />{item.warningDetail || '조립품 참조 파일을 확인해 주세요.'}</> : item.kind === 'drawing' ? '도면 이미지 미리보기 · 원본 PDF 다운로드 가능' : '드래그하여 회전 · 스크롤하여 확대/축소'}</span><span>{formatSize(item.bytes)}</span></footer>
      </section>
    </div>
  );
}

function DrawingPreview({ item }) {
  const [zoom, setZoom] = useState(100);
  const image = `/cad-assets/drawing-previews/${item.id}.png`;
  return (
    <div className="cad-drawing-viewer">
      <div className="cad-sheet-toolbar">
        <span>페이지 1 / {item.pages || 1}</span>
        <div>
          <button type="button" onClick={() => setZoom((value) => Math.max(60, value - 20))} aria-label="도면 축소" disabled={zoom <= 60}>−</button>
          <span>{zoom}%</span>
          <button type="button" onClick={() => setZoom((value) => Math.min(200, value + 20))} aria-label="도면 확대" disabled={zoom >= 200}>+</button>
          <button type="button" onClick={() => setZoom(100)}>맞춤</button>
        </div>
      </div>
      <div className="cad-sheet-scroll"><img src={image} alt={`${item.name} 도면`} style={{ width: `${zoom}%` }} /></div>
    </div>
  );
}

function ModelViewport({ item }) {
  const canvasRef = useRef(null);
  const resetRef = useRef(() => {});
  const [state, setState] = useState({ loading: true, error: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    let active = true;
    let model = null;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#3a3941');
    const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 100000);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.92;
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.065;
    controls.minDistance = 0.01;
    controls.maxDistance = 100000;
    scene.add(new THREE.HemisphereLight(0xffffff, 0x77727f, 1.25));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.45);
    keyLight.position.set(1.8, 2.7, 3.4);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0xd8d9ff, 0.55);
    fillLight.position.set(-2.5, 1.2, -1.4);
    scene.add(fillLight);
    const ground = new THREE.GridHelper(12, 24, 0x8d8994, 0x625f69);
    ground.position.y = -0.001;
    ground.material.opacity = 0.42;
    ground.material.transparent = true;
    scene.add(ground);

    const resize = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas.parentElement);
    resize();

    const loader = new ThreeMFLoader();
    loader.load(item.asset, (loaded) => {
      if (!active) { disposeObject(loaded); return; }
      model = loaded;
      // SOLIDWORKS exports these 3MFs with Y already pointing up.
      scene.add(model);
      model.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(model);
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());
      model.position.sub(center);
      model.updateMatrixWorld(true);
      const maxDimension = Math.max(size.x, size.y, size.z, 0.1);
      ground.scale.setScalar(Math.max(maxDimension / 12, 0.01));
      ground.position.y = -size.y * 0.51;
      camera.near = Math.max(maxDimension / 10000, 0.001);
      camera.far = Math.max(maxDimension * 100, 1000);
      camera.position.set(maxDimension * 1.45, maxDimension * 1.05, maxDimension * 1.45);
      camera.updateProjectionMatrix();
      controls.target.set(0, 0, 0);
      controls.update();
      controls.saveState();
      resetRef.current = () => controls.reset();
      setState({ loading: false, error: '' });
    }, undefined, (error) => {
      if (active) setState({ loading: false, error: error?.message || '3D 모델을 열지 못했습니다.' });
    });

    renderer.setAnimationLoop(() => { controls.update(); renderer.render(scene, camera); });
    return () => {
      active = false;
      observer.disconnect();
      renderer.setAnimationLoop(null);
      controls.dispose();
      if (model) disposeObject(model);
      scene.traverse((object) => { if (object.isLight) return; if (object.geometry) object.geometry.dispose(); if (object.material) disposeMaterial(object.material); });
      renderer.dispose();
    };
  }, [item.asset]);

  return <div className="cad-model-viewport"><canvas ref={canvasRef} aria-label={`${item.name} 3D 회전 보기`} /><div className="cad-model-controls"><span><span className="cad-model-grip" />마우스로 회전</span><button onClick={() => resetRef.current()} aria-label="화면 맞춤"><RotateCcw size={15} />화면 맞춤</button></div>{state.loading && <div className="cad-model-overlay"><LoaderCircle size={22} className="cad-spinner" /><span>3D 모델을 불러오는 중입니다.</span></div>}{state.error && <div className="cad-model-overlay model-error"><AlertTriangle size={21} /><span>{state.error}</span><a href={item.asset} download>3MF 파일 다운로드</a></div>}</div>;
}

function disposeObject(object) {
  object.traverse((node) => { if (node.geometry) node.geometry.dispose(); if (node.material) disposeMaterial(node.material); });
}

function disposeMaterial(material) {
  for (const value of Array.isArray(material) ? material : [material]) {
    Object.values(value).forEach((property) => { if (property?.isTexture) property.dispose(); });
    value.dispose();
  }
}
