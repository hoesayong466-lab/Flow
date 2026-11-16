import { useMemo, useState } from 'react';
import {
  Activity,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  FileSpreadsheet,
  FileText,
  FolderKanban,
  Gauge,
  Hash,
  Inbox,
  LayoutGrid,
  ListFilter,
  MessageSquare,
  MoreHorizontal,
  Paperclip,
  Plus,
  Search,
  Settings2,
  Upload,
  X,
} from 'lucide-react';

const initialProjects = [
  { id: 'luna', name: '루나 행거 압입기 및 지그', customer: '이코리아', owner: '추원훈', due: '2026-11-27', color: 'violet' },
  { id: 'tank', name: '루나 워터탱크 공압기', customer: '이코리아', owner: '김진한', due: '2026-11-20', color: 'blue' },
  { id: 'xg', name: 'XG 스팀모듈 안착 지그', customer: '이코리아', owner: '김진한', due: '2026-11-30', color: 'orange' },
  { id: 'rubber', name: '고무 열융착기', customer: '가람산업', owner: '김철원', due: '2026-12-04', color: 'green' },
];

const makeTasks = () => [
  { id: 't1', group: '설계', title: '설계 및 도면 확정', status: '완료', owner: '설계팀', start: '2026-11-09', due: '2026-11-12', note: '조립도와 가공 도면을 확정했습니다.' },
  { id: 't2', group: '발주 · 입고', title: '가공품 최초 발주', status: '완료', owner: '추원훈', start: '2026-11-12', due: '2026-11-14', order: 'PO-001', note: '베이스 플레이트 2개 입고 완료.' },
  { id: 't3', group: '발주 · 입고', title: '브래킷 추가 발주', status: '부분 입고', owner: '추원훈', start: '2026-11-14', due: '2026-11-18', order: 'PO-002', note: '조립 중 보강 부품이 필요해 4개 추가 발주했습니다.' },
  { id: 't4', group: '발주 · 입고', title: '근접 센서 입고 확인', status: '입고 대기', owner: '추원훈', start: '2026-11-16', due: '2026-11-20', order: 'PO-003', note: 'B상사 납기 확인이 필요합니다.' },
  { id: 't5', group: '조립 · 시운전', title: '기구 조립', status: '진행 중', owner: '조립팀', start: '2026-11-16', due: '2026-11-23', note: '입고된 부품부터 순차 조립합니다.' },
  { id: 't6', group: '조립 · 시운전', title: '시운전 및 납품', status: '대기', owner: '추원훈', start: '2026-11-24', due: '2026-11-27', note: '시운전 완료 후 고객사에 납품합니다.' },
];

const initialOrders = [
  { id: 'PO-001', type: '최초 발주', vendor: 'A정밀', item: '베이스 플레이트', qty: 2, received: 2, due: '11.14', status: '입고 완료', file: '루나_베이스플레이트.xlsx' },
  { id: 'PO-002', type: '추가 발주', vendor: 'A정밀', item: '브래킷 BR-04', qty: 4, received: 2, due: '11.18', status: '부분 입고', file: '루나_브래킷_추가.xlsx' },
  { id: 'PO-003', type: '추가 발주', vendor: 'B상사', item: '근접 센서', qty: 2, received: 0, due: '11.20', status: '발송 완료', file: '루나_센서.xlsx' },
];

const stageGroups = ['설계', '발주 · 입고', '조립 · 시운전'];
const tabs = ['업무', '간트차트', '발주 · 입고', '자료', '활동'];
const fmtShort = (date) => date ? `${Number(date.slice(5, 7))}.${Number(date.slice(8, 10))}` : '미정';

function Status({ children }) {
  const type = children === '완료' || children === '입고 완료' ? 'done'
    : children === '지연' ? 'late'
      : children === '부분 입고' || children === '입고 대기' ? 'waiting'
        : children === '진행 중' || children === '발송 대기' ? 'active' : 'neutral';
  return <span className={`status status-${type}`}><i />{children}</span>;
}

function App() {
  const [projects, setProjects] = useState(initialProjects);
  const [tasksByProject, setTasksByProject] = useState({ luna: makeTasks() });
  const [ordersByProject, setOrdersByProject] = useState({ luna: initialOrders });
  const [projectId, setProjectId] = useState('luna');
  const [tab, setTab] = useState('업무');
  const [filter, setFilter] = useState('전체 업무');
  const [query, setQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modal, setModal] = useState('');
  const [toast, setToast] = useState('');
  const [draftFile, setDraftFile] = useState(null);
  const project = projects.find((item) => item.id === projectId) ?? projects[0];
  const tasks = tasksByProject[projectId] ?? [];
  const orders = ordersByProject[projectId] ?? [];
  const openTask = tasks.find((item) => item.id === selectedTask);
  const openOrder = orders.find((item) => item.id === selectedOrder);

  const filteredTasks = useMemo(() => tasks.filter((task) => {
    const matchesText = `${task.title} ${task.owner} ${task.group}`.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = filter === '전체 업무' || (filter === '미완료' && task.status !== '완료') || task.owner === filter;
    return matchesText && matchesStatus;
  }), [tasks, query, filter]);

  const updateProjectTasks = (nextTasks) => setTasksByProject((current) => ({ ...current, [projectId]: nextTasks }));
  const updateOrders = (nextOrders) => setOrdersByProject((current) => ({ ...current, [projectId]: nextOrders }));
  const flash = (text) => { setToast(text); window.setTimeout(() => setToast(''), 3200); };

  const selectProject = (id) => {
    setProjectId(id);
    setTab('업무');
    setSelectedTask(null);
    setSelectedOrder(null);
    setQuery('');
  };

  const addTask = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    updateProjectTasks([...tasks, {
      id: `task-${Date.now()}`,
      group: form.get('group'),
      title: form.get('title'),
      owner: form.get('owner') || '미정',
      status: '대기',
      start: form.get('start') || '',
      due: form.get('due') || '',
      note: form.get('note') || '',
    }]);
    setModal('');
    flash('업무를 추가했습니다.');
  };

  const addOrder = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const newOrder = {
      id: `PO-${String(orders.length + 1).padStart(3, '0')}`,
      type: form.get('type'),
      vendor: form.get('vendor'),
      item: form.get('item'),
      qty: Number(form.get('qty')),
      received: 0,
      due: fmtShort(form.get('due')),
      status: '발송 대기',
      file: draftFile?.name ?? '',
    };
    updateOrders([...orders, newOrder]);
    setSelectedOrder(newOrder.id);
    setDraftFile(null);
    setModal('');
    setTab('발주 · 입고');
    flash(`${newOrder.id} 발주를 등록했습니다. 실제 이메일 발송은 메일 서버 연동 후 사용할 수 있습니다.`);
  };

  const receiveOrder = (id, amount) => {
    const target = orders.find((order) => order.id === id);
    if (!target || amount < 1 || amount > target.qty - target.received) return;
    const received = target.received + amount;
    updateOrders(orders.map((order) => order.id === id ? {
      ...order,
      received,
      status: received === order.qty ? '입고 완료' : '부분 입고',
    } : order));
    setSelectedOrder(id);
    flash(`입고를 기록했습니다. 잔량 ${target.qty - received}개`);
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="workspace"><div className="workspace-icon"><FolderKanban size={18} /></div><div><strong>설비 진행 관리</strong><small>프로젝트 워크스페이스</small></div><ChevronDown size={15} className="workspace-chevron" /></div>
        <div className="side-scroll">
          <div className="side-section"><div className="side-heading">워크스페이스</div>
            <button className="nav-item" onClick={() => setTab('업무')}><LayoutGrid size={16} />전체 프로젝트</button>
            <button className="nav-item" onClick={() => { setTab('발주 · 입고'); setSelectedOrder(null); }}><Inbox size={16} />발주 · 입고</button>
            <button className="nav-item" onClick={() => setModal('request')}><MessageSquare size={16} />요청 업무<span className="nav-count">3</span></button>
          </div>
          <div className="side-section project-list"><div className="side-heading"><span>프로젝트</span><button aria-label="프로젝트 추가" onClick={() => setModal('project')}><Plus size={15} /></button></div>
            {projects.map((item) => <button key={item.id} className={`project-nav ${projectId === item.id ? 'selected' : ''}`} onClick={() => selectProject(item.id)}><span className={`project-marker ${item.color}`}><Hash size={13} /></span><span className="project-nav-name">{item.name}</span>{item.id === 'luna' && <span className="project-dot" />}</button>)}
          </div>
        </div>
        <div className="sidebar-bottom"><button className="nav-item" onClick={() => flash('설정 화면은 다음 단계에서 연결합니다.')}><Settings2 size={16} />설정</button><div className="user-profile"><div className="user-avatar">김</div><div><strong>설비팀</strong><small>워크스페이스 멤버</small></div><MoreHorizontal size={17} /></div></div>
      </aside>

      <main className="main-area">
        <header className="topbar"><div className="breadcrumbs"><span>프로젝트</span><ChevronRight size={14} /><strong>{project.name}</strong></div><div className="top-actions"><button className="icon-button" aria-label="도움말"><CircleHelp size={17} /></button><button className="icon-button" aria-label="알림"><Bell size={17} /></button><div className="mini-avatar">김</div></div></header>
        <section className="project-header"><div className="project-heading-main"><div className={`large-project-marker ${project.color}`}><FolderKanban size={20} /></div><div><div className="title-row"><h1>{project.name}</h1><button className="icon-button small" aria-label="프로젝트 메뉴"><MoreHorizontal size={17} /></button></div><div className="project-subtitle"><span>{project.customer}</span><span className="separator">·</span><span>담당 {project.owner}</span><span className="separator">·</span><span><CalendarDays size={13} /> 납기 {project.due}</span></div></div></div><div className="header-actions"><button className="button secondary" onClick={() => flash('프로젝트 링크를 복사했습니다.')}><Paperclip size={15} />공유</button><button className="button primary" onClick={() => { setDraftFile(null); setModal('order'); }}><Plus size={15} />발주 등록</button></div></section>
        <nav className="project-tabs">{tabs.map((item) => <button key={item} className={tab === item ? 'active' : ''} onClick={() => { setTab(item); setSelectedTask(null); setSelectedOrder(null); }}>{item}{item === '발주 · 입고' && <span className="tab-count">{orders.length}</span>}</button>)}</nav>
        <section className="page-content">
          {tab === '업무' && <>
            <div className="toolbar"><div className="toolbar-left"><div className="view-select"><ListFilter size={15} /><select value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="업무 필터"><option>전체 업무</option><option>미완료</option><option>추원훈</option><option>설계팀</option><option>조립팀</option></select><ChevronDown size={13} /></div><button className="toolbar-button" onClick={() => setFilter('미완료')}>필터</button><button className="toolbar-button" onClick={() => flash('업무는 제작 단계별로 묶여 있습니다.')}>그룹화 <ChevronDown size={13} /></button></div><div className="toolbar-right"><div className="search-box"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="업무 검색" aria-label="업무 검색" /></div><button className="toolbar-button" onClick={() => setModal('task')}><Plus size={15} />업무 추가</button><button className="icon-button bordered" aria-label="더 보기"><MoreHorizontal size={17} /></button></div></div>
            <TaskGroups tasks={filteredTasks} selectedTask={selectedTask} onSelect={setSelectedTask} />
            {selectedTask && openTask && <TaskDrawer task={openTask} orders={orders} onClose={() => setSelectedTask(null)} onOpenOrder={(id) => { setSelectedOrder(id); setTab('발주 · 입고'); }} onReceive={receiveOrder} onOrder={() => { setDraftFile(null); setModal('order'); }} />}
          </>}
          {tab === '간트차트' && <GanttView tasks={filteredTasks} query={query} setQuery={setQuery} onTaskClick={setSelectedTask} />}
          {tab === '발주 · 입고' && <OrdersView orders={orders} selectedOrder={selectedOrder} onSelect={setSelectedOrder} onAdd={() => { setDraftFile(null); setModal('order'); }} onReceive={receiveOrder} />}
          {tab === '자료' && <FilesView orders={orders} />}
          {tab === '활동' && <ActivityView orders={orders} tasks={tasks} />}
        </section>
      </main>
      {modal && <Modal title={modal === 'task' ? '새 업무' : modal === 'order' ? '발주 등록' : modal === 'project' ? '프로젝트 추가' : '요청 업무 등록'} onClose={() => setModal('')}>
        {modal === 'task' ? <TaskForm onSubmit={addTask} onCancel={() => setModal('')} /> : modal === 'order' ? <OrderForm file={draftFile} setFile={setDraftFile} project={project} onSubmit={addOrder} onCancel={() => setModal('')} /> : <BasicForm type={modal} onCancel={() => setModal('')} onSubmit={(event) => { event.preventDefault(); setModal(''); flash('등록 화면 예시입니다.'); }} />}
      </Modal>}
      {toast && <div className="toast" role="status"><Check size={16} />{toast}</div>}
    </div>
  );
}

function TaskGroups({ tasks, selectedTask, onSelect }) {
  return <div className="task-groups">{stageGroups.map((group) => {
    const entries = tasks.filter((task) => task.group === group);
    if (!entries.length) return null;
    return <section className="task-group" key={group}><div className="group-heading"><span className="group-chevron"><ChevronDown size={14} /></span><span className="group-color-dot" />{group}<span className="group-total">{entries.length}</span><button className="group-menu" aria-label={`${group} 메뉴`}><MoreHorizontal size={16} /></button></div><div className="task-columns"><span>업무명</span><span>상태</span><span>담당자</span><span>마감일</span></div>{entries.map((task) => <button key={task.id} className={`task-row ${selectedTask === task.id ? 'row-selected' : ''}`} onClick={() => onSelect(selectedTask === task.id ? null : task.id)}><span className="task-title-cell"><span className={`task-check ${task.status === '완료' ? 'checked' : ''}`}>{task.status === '완료' && <Check size={12} />}</span><span className="task-title-text">{task.title}</span>{task.order && <span className="order-ref">{task.order}</span>}</span><span><Status>{task.status}</Status></span><span className="assignee"><span className="assignee-avatar">{task.owner[0]}</span>{task.owner}</span><span className="due-date">{fmtShort(task.due)}</span></button>)}<button className="add-task-row" onClick={() => onSelect(null)}><Plus size={14} />업무 추가</button></section>;
  })}</div>;
}

function TaskDrawer({ task, orders, onClose, onOpenOrder, onReceive, onOrder }) {
  const [comment, setComment] = useState('');
  const order = orders.find((item) => item.id === task.order);
  return <aside className="task-drawer"><div className="drawer-top"><span>업무 상세</span><button className="icon-button small" onClick={onClose} aria-label="상세 닫기"><X size={17} /></button></div><div className="drawer-body"><Status>{task.status}</Status><h2>{task.title}</h2><div className="drawer-field"><span>담당자</span><div><span className="assignee-avatar">{task.owner[0]}</span>{task.owner}</div></div><div className="drawer-field"><span>시작일</span><div><CalendarDays size={14} />{task.start || '미정'}</div></div><div className="drawer-field"><span>마감일</span><div><CalendarDays size={14} />{task.due || '미정'}</div></div><div className="drawer-field"><span>단계</span><div>{task.group}</div></div><div className="drawer-description"><span>진행 메모</span><p>{task.note || '등록된 메모가 없습니다.'}</p></div>{order && <div className="drawer-order"><div className="drawer-order-heading"><span>연결 발주</span><button className="text-link" onClick={() => onOpenOrder(order.id)}>{order.id}<ChevronRight size={13} /></button></div><div className="order-preview"><FileSpreadsheet size={17} /><div><strong>{order.file || order.item}</strong><small>{order.vendor} · {order.received}/{order.qty}개 입고</small></div><Status>{order.status}</Status></div>{order.received < order.qty && <button className="button secondary full-width" onClick={() => onReceive(order.id, order.qty - order.received)}>입고 처리</button>}</div>}<button className="button secondary full-width" onClick={onOrder}><Plus size={14} />추가 발주</button><div className="drawer-comments"><h3><MessageSquare size={15} />댓글</h3><div className="comment"><span className="assignee-avatar">추</span><div><strong>추원훈 <small>오늘 09:30</small></strong><p>입고된 부품부터 조립 진행하겠습니다.</p></div></div></div></div><form className="comment-compose" onSubmit={(event) => { event.preventDefault(); if (comment.trim()) setComment(''); }}><textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="댓글 남기기" rows="2" /><div><button type="button" className="icon-button small"><Paperclip size={15} /></button><button type="submit" className="button primary small-button" disabled={!comment.trim()}>보내기</button></div></form></aside>;
}

function GanttView({ tasks, query, setQuery, onTaskClick }) {
  const startDay = 9;
  const days = Array.from({ length: 21 }, (_, index) => index + startDay);
  return <><div className="toolbar"><div className="toolbar-left"><div className="view-select"><CalendarDays size={15} /><select aria-label="일정 단위"><option>주 단위</option><option>일 단위</option><option>월 단위</option></select><ChevronDown size={13} /></div><button className="toolbar-button">오늘</button><span className="date-range">2026년 11월 9일 – 11월 29일</span></div><div className="toolbar-right"><div className="search-box"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="업무 검색" /></div></div></div><div className="gantt-scroll"><div className="gantt-grid"><div className="gantt-header"><div className="gantt-task-col">업무명</div><div className="gantt-owner-col">담당자</div><div className="gantt-calendar"><div className="month-row"><span>2026년 11월</span></div><div className="day-row">{days.map((day) => <span key={day} className={day === 16 ? 'today-col' : ''}>{day}</span>)}</div></div></div>{stageGroups.map((group) => <div key={group}><div className="gantt-group-name">⌄　{group}</div>{tasks.filter((task) => task.group === group).map((task) => <div className="gantt-line" key={task.id}><button className="gantt-task-title" onClick={() => onTaskClick(task.id)}>{task.title}</button><span className="gantt-owner">{task.owner}</span><div className="gantt-track">{days.map((day) => <i key={day} className={day === 16 ? 'today-col' : ''} />)}<button className={`gantt-bar ${task.status === '완료' ? 'bar-done' : task.status === '부분 입고' ? 'bar-wait' : ''}`} style={barStyle(task.start, task.due)} onClick={() => onTaskClick(task.id)}>{task.title}</button></div></div>)}</div>)}</div></div></>;
}

function barStyle(start, due) {
  const first = start ? Number(start.slice(8, 10)) : 16;
  const last = due ? Number(due.slice(8, 10)) : first + 2;
  return { '--start': `${Math.max(0, first - 9) / 21 * 100}%`, '--width': `${Math.max(1.5, (last - first + 1) / 21 * 100)}%` };
}

function OrdersView({ orders, selectedOrder, onSelect, onAdd, onReceive }) {
  const [filter, setFilter] = useState('전체 발주');
  const [query, setQuery] = useState('');
  const order = orders.find((item) => item.id === selectedOrder);
  const visible = orders.filter((item) => `${item.id} ${item.vendor} ${item.item}`.toLowerCase().includes(query.toLowerCase()) && (filter === '전체 발주' || item.status !== '입고 완료'));
  return <><div className="toolbar"><div className="toolbar-left"><div className="view-select"><ListFilter size={15} /><select value={filter} onChange={(event) => setFilter(event.target.value)}><option>전체 발주</option><option>미입고</option></select><ChevronDown size={13} /></div><span className="orders-summary">미입고 {orders.filter((item) => item.received < item.qty).length}건</span></div><div className="toolbar-right"><div className="search-box"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="발주 검색" /></div><button className="button primary" onClick={onAdd}><Plus size={15} />발주 등록</button></div></div><div className={`orders-layout ${order ? 'with-order-detail' : ''}`}><div className="orders-table-wrap"><table className="orders-table"><thead><tr><th>발주번호</th><th>유형</th><th>공급사</th><th>품목</th><th>납기</th><th>상태</th><th>입고</th></tr></thead><tbody>{visible.map((item) => <tr key={item.id} className={selectedOrder === item.id ? 'selected-order' : ''} onClick={() => onSelect(item.id)}><td><strong>{item.id}</strong></td><td>{item.type}</td><td>{item.vendor}</td><td>{item.item}</td><td>{item.due}</td><td><Status>{item.status}</Status></td><td>{item.received} / {item.qty}</td></tr>)}</tbody></table>{visible.length === 0 && <div className="empty-state">조건에 맞는 발주가 없습니다.</div>}</div>{order && <OrderDetail order={order} onClose={() => onSelect(null)} onReceive={onReceive} />}</div></>;
}

function OrderDetail({ order, onClose, onReceive }) {
  return <aside className="order-detail"><div className="drawer-top"><strong>{order.id} · {order.type}</strong><button className="icon-button small" onClick={onClose} aria-label="상세 닫기"><X size={17} /></button></div><div className="drawer-body"><Status>{order.status}</Status><h2>{order.item}</h2><div className="drawer-field"><span>공급 거래처</span><div>{order.vendor}</div></div><div className="drawer-field"><span>수량</span><div>{order.received} / {order.qty}개 입고</div></div><div className="drawer-field"><span>납기일</span><div>2026.{order.due}</div></div><div className="drawer-field"><span>메일 발송</span><div>{order.status === '발송 대기' ? '서버 연동 대기' : '발송 완료 · 11.14 14:20'}</div></div><div className="order-preview"><FileSpreadsheet size={17} /><div><strong>{order.file || '첨부 파일 없음'}</strong><small>발주 원본 엑셀</small></div></div>{order.received < order.qty && <button className="button primary full-width" onClick={() => onReceive(order.id, order.qty - order.received)}>잔량 {order.qty - order.received}개 입고 처리</button>}</div></aside>;
}

function FilesView({ orders }) {
  return <><div className="toolbar"><div><h2 className="section-title">프로젝트 자료</h2><p className="section-description">도면과 발주 파일을 프로젝트 단위로 모아봅니다.</p></div><button className="button secondary"><Upload size={15} />자료 추가</button></div><div className="file-list">{[{ name: '루나_조립도_Rev2.pdf', group: '설계', date: '11.10' }, ...orders.map((order) => ({ name: order.file || `${order.id}_${order.item}.xlsx`, group: order.id, date: order.due }))].map((file) => <div className="file-row" key={file.name}><span className="file-icon"><FileText size={17} /></span><strong>{file.name}</strong><span>{file.group}</span><span>{file.date}</span><button className="icon-button small" aria-label="파일 메뉴"><MoreHorizontal size={16} /></button></div>)}</div></>;
}

function ActivityView({ orders, tasks }) {
  return <div className="activity-feed"><div className="activity-date">오늘 · 2026년 11월 16일</div><ActivityEntry icon={<Inbox size={15} />} title="브래킷 입고 기록" detail={`${orders.find((order) => order.id === 'PO-002')?.received ?? 0} / 4개 입고 · 추원훈`} time="오전 9:30" /><ActivityEntry icon={<MessageSquare size={15} />} title="조립 진행 메모" detail={tasks.find((task) => task.id === 't5')?.note ?? '진행 사항 업데이트'} time="오전 9:10" /><ActivityEntry icon={<FileSpreadsheet size={15} />} title="PO-002 추가 발주 메일 발송" detail="A정밀 · purchase@example.com" time="11월 14일 오후 2:20" /></div>;
}

function ActivityEntry({ icon, title, detail, time }) {
  return <article className="activity-entry"><div className="activity-icon">{icon}</div><div><strong>{title}</strong><p>{detail}</p></div><time>{time}</time></article>;
}

function Modal({ title, onClose, children }) {
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><header><h2 id="modal-title">{title}</h2><button className="icon-button small" onClick={onClose} aria-label="닫기"><X size={17} /></button></header>{children}</section></div>;
}

function TaskForm({ onSubmit, onCancel }) {
  return <form className="form-body" onSubmit={onSubmit}><label><span>업무명</span><input name="title" required placeholder="예: 모터 브래킷 가공" /></label><div className="form-pair"><label><span>그룹</span><select name="group"><option>설계</option><option>발주 · 입고</option><option>조립 · 시운전</option></select></label><label><span>담당자</span><input name="owner" placeholder="담당자" /></label></div><div className="form-pair"><label><span>시작일</span><input name="start" type="date" /></label><label><span>마감일</span><input name="due" type="date" /></label></div><label><span>설명</span><textarea name="note" rows="3" placeholder="업무 내용이나 확인 사항" /></label><div className="modal-actions"><button type="button" className="button secondary" onClick={onCancel}>취소</button><button className="button primary" type="submit">업무 추가</button></div></form>;
}

function OrderForm({ file, setFile, project, onSubmit, onCancel }) {
  return <form className="form-body" onSubmit={onSubmit}><div className="form-hint"><FolderKanban size={15} />{project.name}</div><div className="form-pair"><label><span>발주 유형</span><select name="type"><option>추가 발주</option><option>최초 발주</option><option>정정 발주</option></select></label><label><span>공급 거래처</span><select name="vendor"><option>A정밀</option><option>B상사</option></select></label></div><label><span>품목 / 규격</span><input name="item" required placeholder="예: 브래킷 BR-04" /></label><div className="form-pair"><label><span>수량</span><input name="qty" type="number" min="1" required defaultValue="1" /></label><label><span>요청 납기</span><input name="due" type="date" required /></label></div><label><span>발주 엑셀</span><div className="upload-field"><Upload size={17} /><input type="file" accept=".xlsx,.xls" onChange={(event) => setFile(event.target.files?.[0] ?? null)} aria-label="발주 엑셀" /><small>{file ? file.name : '거래처에 보낼 발주 파일을 선택하세요'}</small></div></label><div className="mail-preview"><span>메일 미리보기</span><strong>[추가 발주] {project.name}</strong><p>안녕하세요. 첨부한 발주서의 품목과 납기를 확인 부탁드립니다.</p><small>등록 시 발송 대기로 저장됩니다. 메일 자동 발송은 서버 연결 후 가능합니다.</small></div><div className="modal-actions"><button type="button" className="button secondary" onClick={onCancel}>취소</button><button type="submit" className="button primary">발주 등록</button></div></form>;
}

function BasicForm({ type, onCancel, onSubmit }) {
  return <form className="form-body" onSubmit={onSubmit}><label><span>{type === 'project' ? '프로젝트명' : '요청 업무'}</span><input required placeholder="이름을 입력하세요" /></label><div className="form-pair"><label><span>고객사</span><input placeholder="고객사" /></label><label><span>담당자</span><input placeholder="담당자" /></label></div><div className="modal-actions"><button type="button" className="button secondary" onClick={onCancel}>취소</button><button className="button primary">등록</button></div></form>;
}

export default App;
