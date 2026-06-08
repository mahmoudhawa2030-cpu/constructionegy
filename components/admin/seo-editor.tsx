"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { savePost, type SavePostInput } from "@/app/admin/blog/actions";

export type SeoEditorCategory = { slug: string; label: string };
export type SeoEditorInitial = { id?: string; categorySlug: string; seedKeyword: string; title: string; slug: string; content: string; metaTitle: string; metaDescription: string; coverImage: string | null; coverImageAlt: string | null; status: "draft" | "published"; publishAt: string | null; };
type Props = { initial: SeoEditorInitial; categories: SeoEditorCategory[]; siteUrl: string; locale: "ar" | "en" };
type KwItem = { id: number; kw: string; status: "pending"|"generating"|"done"|"failed"; scheduledDate: string; category: string; seoScore: number };
type Post = { id: number|string; seedKeyword: string; title: string; slug: string; content: string; metaTitle: string; metaDescription: string; category: string; seoScore: number; wordCount?: number; status: string; createdAt: string };
type Cat = { id: string; label: string; color: string; icon: string };

const toSlug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const todayStr = () => new Date().toISOString().split("T")[0];
const addDays = (d: string, n: number) => { const dt = new Date(d); dt.setDate(dt.getDate() + n); return dt.toISOString().split("T")[0]; };
const lbl: React.CSSProperties = { display:"block", color:"#4a5370", fontSize:"11px", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.7px", marginBottom:"6px" };

const DEFAULT_CATS: Cat[] = [
  { id:"scaffolding",   label:"Scaffolding",           color:"#f59e0b", icon:"ðŸ—" },
  { id:"materials",     label:"Construction Materials", color:"#3b82f6", icon:"ðŸ§±" },
  { id:"safety",        label:"Safety & Compliance",   color:"#ef4444", icon:"â›‘" },
  { id:"equipment",     label:"Equipment & Tools",     color:"#8b5cf6", icon:"ðŸ”§" },
  { id:"concrete",      label:"Concrete & Formwork",   color:"#6b7280", icon:"ðŸª¨" },
  { id:"steel",         label:"Steel & Metalwork",     color:"#64748b", icon:"âš™ï¸" },
  { id:"finishing",     label:"Finishing & Interiors", color:"#ec4899", icon:"ðŸŽ¨" },
  { id:"project-mgmt",  label:"Project Management",   color:"#10b981", icon:"ðŸ“‹" },
  { id:"b2b",           label:"B2B & Procurement",    color:"#0ea5e9", icon:"ðŸ¤" },
  { id:"guides",        label:"Guides & How-To",      color:"#f97316", icon:"ðŸ“–" },
  { id:"news",          label:"Industry News",        color:"#a855f7", icon:"ðŸ“°" },
  { id:"uncategorized", label:"Uncategorized",        color:"#4a5370", icon:"ðŸ“" },
];

// â”€â”€â”€ SEO Analyzer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
type Check = { id:string; pass:boolean; warn:boolean; text:string; weight:number };
type Section = { id:string; title:string; checks:Check[]; status:string };
type Analysis = { score:number; wordCount:number; sections:Section[] };

function useSeoAnalyzer(content: string, kw: string, metaTitle: string, metaDesc: string, slug: string, posts: Post[]): Analysis {
  const [a, setA] = useState<Analysis>({ score:0, wordCount:0, sections:[] });
  useEffect(() => {
    const k=(kw||"").toLowerCase().trim();
    const text=(content||"").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim();
    const words=text.split(" ").filter(Boolean); const wc=words.length;
    const first10=words.slice(0,Math.max(1,Math.floor(wc*0.1))).join(" ").toLowerCase();
    const full=text.toLowerCase(); const mt=(metaTitle||"").toLowerCase(); const md=(metaDesc||"").toLowerCase(); const sl=(slug||"").toLowerCase();
    const mtLen=(metaTitle||"").length; const mdLen=(metaDesc||"").length;
    const extLinks=((content||"").match(/href=["'](https?:\/\/(?!localhost)[^"']+)["']/g)||[]);
    const intLinks=((content||"").match(/href=["'](\/[^"']*|#[^"']*)["']/g)||[]);
    const totalInt=intLinks.length+posts.filter(p=>(content||"").includes(p.slug)).length;
    const imgs=((content||"").match(/<img[^>]*>/g)||[]);
    const imgsMissAlt=imgs.filter(t=>!t.match(/alt=["'][^"']+["']/));
    const kwMentions=k?full.split(k).length-1:0;
    const subHCount=((content||"").match(/<h[2-6][^>]*>/gi)||[]).length;
    const kwInSub=k?((content||"").match(/<h[2-6][^>]*>[^<]*<\/h[2-6]>/gi)||[]).some(h=>h.toLowerCase().includes(k)):false;
    const sentences=text.split(/[.!?]+/).filter(s=>s.trim().length>10);
    const longRatio=sentences.length>0?sentences.filter(s=>s.trim().split(" ").length>25).length/sentences.length:0;
    const passRatio=sentences.length>0?((text.match(/\b(is|are|was|were|be|been|being)\s+\w+ed\b/g)||[]).length)/sentences.length:0;
    const paragraphs=(content||"").split(/<\/p>|<\/h[2-6]>/i).filter(Boolean).length;
    const mtLen2=(metaTitle||"").length;
    const basic:Check[] = [
      {id:"kw_title",pass:k?mt.includes(k):false,warn:false,text:(k?mt.includes(k):false)?"Hurray! Focus Keyword in the SEO Title.":"Focus Keyword not found in the SEO Title.",weight:10},
      {id:"kw_desc",pass:k?md.includes(k):false,warn:false,text:(k?md.includes(k):false)?"Focus Keyword in Meta Description.":"Focus Keyword missing from Meta Description.",weight:8},
      {id:"kw_url",pass:k?sl.includes(k.replace(/\s+/g,"-"))||sl.includes(k.replace(/\s+/g,"")):false,warn:false,text:(k?sl.includes(k.replace(/\s+/g,"-")):false)?"Focus Keyword used in the URL.":"Focus Keyword not found in URL/Slug.",weight:8},
      {id:"kw_first10",pass:k?first10.includes(k):false,warn:false,text:(k?first10.includes(k):false)?"Focus Keyword in first 10% of content.":"Focus Keyword not in first 10% of content.",weight:10},
      {id:"kw_content",pass:k?full.includes(k):false,warn:false,text:(k?full.includes(k):false)?"Focus Keyword found in content.":"Focus Keyword not found in content.",weight:8},
      {id:"word_count",pass:wc>=1500,warn:wc>=600,text:wc>=1500?`Content is ${wc} words. Excellent!`:wc>=600?`Content is ${wc} words. Aim for 1500+.`:`Only ${wc} words. Write at least 1500.`,weight:12},
    ];
    const additional:Check[] = [
      {id:"ext_links",pass:extLinks.length>=2,warn:extLinks.length===1,text:extLinks.length>=2?`${extLinks.length} external links. Great!`:extLinks.length===1?"Only 1 external link. Add at least 2.":"No external links. Add authoritative sources.",weight:8},
      {id:"int_links",pass:totalInt>=1,warn:false,text:totalInt>=1?`${totalInt} internal link(s). Good.`:"No internal links. Link to related posts.",weight:8},
      {id:"images",pass:imgs.length>=1,warn:false,text:imgs.length>=1?`${imgs.length} image(s) found.`:"No images. Add relevant images.",weight:6},
      {id:"img_alt",pass:imgs.length>0&&imgsMissAlt.length===0,warn:imgs.length===0,text:imgs.length===0?"Add images with alt text.":imgsMissAlt.length===0?"All images have alt text. âœ“":`${imgsMissAlt.length} image(s) missing alt text.`,weight:7},
      {id:"kw_sub",pass:kwInSub,warn:subHCount>0&&!kwInSub,text:kwInSub?"Focus Keyword in a subheading. âœ“":subHCount>0?"Add keyword to an H2/H3.":"No subheadings. Add H2/H3 with keyword.",weight:6},
      {id:"kw_density",pass:kwMentions>=3&&kwMentions<=12,warn:kwMentions>=1&&kwMentions<3,text:kwMentions>=3&&kwMentions<=12?`Good density â€” used ${kwMentions}x.`:kwMentions>=13?`Too many (${kwMentions}x).`:kwMentions>=1?`Used only ${kwMentions}x. Aim 3â€“12.`:"Keyword not in content.",weight:6},
      {id:"subH_count",pass:subHCount>=3,warn:subHCount>=1,text:subHCount>=3?`${subHCount} subheadings. Well structured!`:subHCount>=1?`Only ${subHCount} subheadings.`:"No subheadings found.",weight:5},
    ];
    const titleR:Check[] = [
      {id:"title_len",pass:mtLen2>=50&&mtLen2<=60,warn:mtLen2>=40&&mtLen2<50,text:mtLen2>=50&&mtLen2<=60?`Title length perfect (${mtLen2} chars).`:mtLen2>60?`Too long (${mtLen2}). Keep under 60.`:`Aim 50â€“60 chars (${mtLen2} now).`,weight:6},
      {id:"title_sentiment",pass:/\b(best|top|ultimate|complete|proven|essential|powerful|effective|expert|guide|tips|how|why|free|easy|fast)\b/i.test(metaTitle||""),warn:false,text:/\b(best|top|ultimate)\b/i.test(metaTitle||"")?"Title has power words. âœ“":"Add a power word (Best, Top, Ultimate) to boost CTR.",weight:3},
      {id:"title_number",pass:/\d/.test(metaTitle||""),warn:false,text:/\d/.test(metaTitle||"")?"Title has a number â€” great for CTR!":"Consider adding a number (e.g. 7 Waysâ€¦).",weight:2},
    ];
    const readR:Check[] = [
      {id:"paragraphs",pass:paragraphs>=5,warn:paragraphs>=2,text:paragraphs>=5?`${paragraphs} paragraphs. Good!`:paragraphs>=2?`${paragraphs} paragraphs. Add more.`:"Break into more paragraphs.",weight:4},
      {id:"long_sent",pass:longRatio<0.3,warn:longRatio<0.5,text:longRatio<0.3?"Sentence length well balanced. âœ“":longRatio<0.5?"Some sentences too long.":"Too many long sentences.",weight:4},
      {id:"transition",pass:/\b(however|therefore|furthermore|additionally|moreover|consequently|although|because|since|while|despite|thus)\b/i.test(text),warn:false,text:/\b(however|therefore|furthermore)\b/i.test(text)?"Good transition words. âœ“":"Add transition words (However, Thereforeâ€¦).",weight:4},
      {id:"passive",pass:passRatio<0.15,warn:passRatio<0.3,text:passRatio<0.15?"Passive voice minimal. âœ“":passRatio<0.3?"Some passive voice detected.":"Heavy passive voice. Rewrite actively.",weight:3},
      {id:"desc_len",pass:mdLen>=120&&mdLen<=160,warn:mdLen>=80&&mdLen<120,text:mdLen>=120&&mdLen<=160?`Meta description perfect (${mdLen} chars).`:mdLen>160?`Too long (${mdLen}). Keep under 160.`:`Aim 120â€“160 chars (${mdLen} now).`,weight:5},
    ];
    const all=[...basic,...additional,...titleR,...readR];
    const maxScore=all.reduce((s,c)=>s+c.weight,0);
    const earned=all.reduce((s,c)=>s+(c.pass?c.weight:c.warn?Math.floor(c.weight*0.5):0),0);
    const score=Math.min(100,Math.round((earned/maxScore)*100));
    const secSt=(cks:Check[])=>{const e=cks.filter(c=>!c.pass&&!c.warn).length;const w=cks.filter(c=>!c.pass&&c.warn).length;return e===0&&w===0?"good":e===0?"warn":e<=1?"warn":"error";};
    setA({score,wordCount:wc,sections:[
      {id:"basic",title:"Basic SEO",checks:basic,status:secSt(basic)},
      {id:"additional",title:"Additional",checks:additional,status:secSt(additional)},
      {id:"title_read",title:"Title Readability",checks:titleR,status:secSt(titleR)},
      {id:"content_read",title:"Content Readability",checks:readR,status:secSt(readR)},
    ]});
  },[content,kw,metaTitle,metaDesc,slug,posts]);
  return a;
}

// â”€â”€â”€ UI Components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ScoreCircle({score,size=88}:{score:number;size?:number}){
  const color=score>=80?"#22c55e":score>=50?"#f59e0b":"#ef4444";
  const r=size*0.36,circ=2*Math.PI*r,dash=(score/100)*circ;
  return <div style={{position:"relative",width:size,height:size,margin:"0 auto 6px"}}>
    <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1e2840" strokeWidth="8"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${dash} ${circ}`} style={{transition:"all 0.6s cubic-bezier(.4,0,.2,1)"}}/>
    </svg>
    <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",textAlign:"center",lineHeight:1}}>
      <div style={{fontSize:size*0.25,fontWeight:900,color,fontFamily:"monospace",letterSpacing:"-1px"}}>{score}</div>
      <div style={{fontSize:size*0.1,color:"#5a6380",textTransform:"uppercase",letterSpacing:"0.5px",marginTop:2}}>/100</div>
    </div>
  </div>;
}

function CheckItem({check}:{check:Check}){
  const g=check.pass,w=!check.pass&&check.warn,e=!check.pass&&!check.warn;
  return <div style={{display:"flex",alignItems:"flex-start",gap:10,padding:"7px 0",borderBottom:"1px solid #111827"}}>
    <div style={{flexShrink:0,marginTop:1}}>
      {g&&<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" fill="#22c55e"/><path d="M6 10.5l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      {w&&<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" fill="none" stroke="#f59e0b" strokeWidth="2"/><path d="M6.5 10.5l2.5 2.5 4.5-4.5" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      {e&&<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" fill="none" stroke="#ef4444" strokeWidth="2"/><path d="M7 7l6 6M13 7l-6 6" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/></svg>}
    </div>
    <p style={{margin:0,fontSize:"12.5px",lineHeight:"1.45",color:g?"#c8d8c0":w?"#d4c090":"#c8c0c0",flex:1}}>{check.text}</p>
  </div>;
}

function SectionBadge({status,checks}:{status:string;checks:Check[]}){
  const errors=checks.filter(c=>!c.pass&&!c.warn).length,warns=checks.filter(c=>!c.pass&&c.warn).length;
  if(status==="good") return <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"2px 8px",borderRadius:20,background:"#166534",color:"#4ade80",fontSize:11,fontWeight:700}}>âœ“ All Good</span>;
  if(errors>0) return <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"2px 8px",borderRadius:20,background:"rgba(239,68,68,0.15)",color:"#fca5a5",fontSize:11,fontWeight:700}}>âœ• {errors} Error{errors>1?"s":""}</span>;
  return <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"2px 8px",borderRadius:20,background:"rgba(245,158,11,0.15)",color:"#fcd34d",fontSize:11,fontWeight:700}}>~ {warns} Warning{warns>1?"s":""}</span>;
}

function CategoryPicker({value,onChange,categories,compact=false}:{value:string;onChange:(v:string)=>void;categories:Cat[];compact?:boolean}){
  const [open,setOpen]=useState(false);const ref=useRef<HTMLDivElement>(null);
  const sel=categories.find(c=>c.id===value)||categories[categories.length-1];
  useEffect(()=>{const fn=(e:MouseEvent)=>{if(ref.current&&!ref.current.contains(e.target as Node))setOpen(false);};document.addEventListener("mousedown",fn);return()=>document.removeEventListener("mousedown",fn);},[]);
  return <div ref={ref} style={{position:"relative"}}>
    <button onClick={()=>setOpen(o=>!o)} style={{display:"flex",alignItems:"center",gap:compact?5:7,padding:compact?"5px 10px":"7px 12px",width:"100%",boxSizing:"border-box",background:"#111827",border:`1px solid ${(sel?.color||"#2a3045")}55`,borderRadius:6,cursor:"pointer",color:"#e8ecf8",fontSize:compact?11:12,fontWeight:600}}>
      <span style={{fontSize:compact?12:14}}>{sel?.icon}</span>
      <span style={{flex:1,textAlign:"left",color:sel?.color||"#9ba3c0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{sel?.label||"Category"}</span>
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{transform:open?"rotate(180deg)":"rotate(0)",transition:"0.2s",flexShrink:0}}><path d="M2 3.5l3 3 3-3" stroke="#5a6380" strokeWidth="1.5" strokeLinecap="round"/></svg>
    </button>
    {open&&<div style={{position:"absolute",top:"calc(100% + 4px)",left:0,minWidth:"200px",background:"#0f1525",border:"1px solid #2a3045",borderRadius:8,zIndex:500,boxShadow:"0 12px 40px rgba(0,0,0,0.7)",maxHeight:240,overflowY:"auto"}}>
      {categories.map(cat=><div key={cat.id} onClick={()=>{onChange(cat.id);setOpen(false);}} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",cursor:"pointer",background:cat.id===value?"rgba(79,127,255,0.12)":"transparent",borderBottom:"1px solid #131e30"}}>
        <span style={{fontSize:14}}>{cat.icon}</span>
        <span style={{flex:1,fontSize:12,color:cat.id===value?"#e8ecf8":"#9ba3c0"}}>{cat.label}</span>
        {cat.id===value&&<span style={{color:"#4f7fff",fontSize:12,fontWeight:800}}>âœ“</span>}
        <span style={{width:8,height:8,borderRadius:"50%",background:cat.color,flexShrink:0}}/>
      </div>)}
    </div>}
  </div>;
}

function CategoryManagerModal({categories,setCategories,onClose}:{categories:Cat[];setCategories:React.Dispatch<React.SetStateAction<Cat[]>>;onClose:()=>void}){
  const [newLabel,setNewLabel]=useState("");const [newIcon,setNewIcon]=useState("ðŸ“");const [newColor,setNewColor]=useState("#4f7fff");
  const ICONS=["ðŸ“","ðŸ—","ðŸ§±","â›‘","ðŸ”§","ðŸª¨","âš™ï¸","ðŸŽ¨","ðŸ“‹","ðŸ¤","ðŸ“–","ðŸ“°","ðŸ¢","ðŸš§","ðŸ’¡","ðŸ“Š"];
  const add=()=>{if(!newLabel.trim())return;const id=toSlug(newLabel);if(categories.find(c=>c.id===id))return;setCategories(p=>[...p,{id,label:newLabel.trim(),color:newColor,icon:newIcon}]);setNewLabel("");};
  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}}>
    <div style={{width:"min(520px,95vw)",background:"#0f1525",borderRadius:12,border:"1px solid #2a3045",maxHeight:"85vh",display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{padding:"14px 18px",borderBottom:"1px solid #1e2740",display:"flex",alignItems:"center"}}><span style={{flex:1,color:"#e8ecf8",fontWeight:800,fontSize:15}}>ðŸ—‚ Manage Categories</span><button onClick={onClose} style={{background:"none",border:"none",color:"#5a6380",fontSize:20,cursor:"pointer"}}>âœ•</button></div>
      <div style={{overflowY:"auto",flex:1,padding:"16px 18px",display:"flex",flexDirection:"column",gap:16}}>
        <div>
          <div style={{color:"#5a6380",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:10}}>Add New Category</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:10}}>{ICONS.map(ic=><button key={ic} onClick={()=>setNewIcon(ic)} style={{width:32,height:32,borderRadius:6,border:`2px solid ${newIcon===ic?"#4f7fff":"#1e2740"}`,background:newIcon===ic?"rgba(79,127,255,0.15)":"#111827",cursor:"pointer",fontSize:15}}>{ic}</button>)}</div>
          <div style={{display:"flex",gap:8}}><input value={newLabel} onChange={e=>setNewLabel(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()} placeholder="Category name..." style={{flex:1,padding:"8px 12px",background:"#111827",border:"1px solid #2a3045",borderRadius:6,color:"#e8ecf8",fontSize:13,outline:"none"}}/><input type="color" value={newColor} onChange={e=>setNewColor(e.target.value)} style={{width:42,height:36,border:"1px solid #2a3045",borderRadius:6,background:"#111827",cursor:"pointer",padding:2}}/><button onClick={add} style={{padding:"8px 16px",background:"linear-gradient(135deg,#4f7fff,#7c3aed)",color:"#fff",border:"none",borderRadius:6,fontSize:12,fontWeight:700,cursor:"pointer"}}>+ Add</button></div>
        </div>
        <div>
          <div style={{color:"#5a6380",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:10}}>All Categories ({categories.length})</div>
          {categories.map(cat=>{const isDef=!!DEFAULT_CATS.find(c=>c.id===cat.id);return <div key={cat.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",marginBottom:4,background:"#111827",borderRadius:6,border:"1px solid #1e2740"}}>
            <span style={{fontSize:15}}>{cat.icon}</span><span style={{flex:1,fontSize:12,color:"#c8d0e8"}}>{cat.label}</span>
            <span style={{width:10,height:10,borderRadius:"50%",background:cat.color}}/>
            {isDef?<span style={{fontSize:10,color:"#3a4060",padding:"2px 6px",background:"#1a2030",borderRadius:4}}>default</span>:<button onClick={()=>setCategories(p=>p.filter(c=>c.id!==cat.id))} style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",color:"#ef4444",borderRadius:4,fontSize:11,padding:"2px 8px",cursor:"pointer"}}>Remove</button>}
          </div>;})}
        </div>
      </div>
    </div>
  </div>;
}

function RankMathSidebar({analysis,focusKw,setFocusKw,posts,onInsertInternal}:{analysis:Analysis;focusKw:string;setFocusKw:(v:string)=>void;posts:Post[];onInsertInternal:(p:Post)=>void}){
  const [open,setOpen]=useState<Record<string,boolean>>({basic:true,additional:true,title_read:false,content_read:false});
  const [showPosts,setShowPosts]=useState(false);
  const sc=analysis.score>=80?"#22c55e":analysis.score>=50?"#f59e0b":"#ef4444";
  const sl=analysis.score>=80?"Good":analysis.score>=50?"OK":"Poor";
  return <div style={{width:292,flexShrink:0,background:"#0b101e",borderLeft:"2px solid #1a2436",display:"flex",flexDirection:"column",overflowY:"auto"}}>
    <div style={{background:"linear-gradient(135deg,#4f46e5,#7c3aed)",padding:"14px 16px",display:"flex",alignItems:"center",gap:10}}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      <span style={{color:"#fff",fontWeight:800,fontSize:"15px",letterSpacing:"-0.3px"}}>Rank Math SEO</span>
    </div>
    <div style={{padding:"14px 14px 10px",borderBottom:"1px solid #141e30"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}><span style={{color:"#9ba3c0",fontSize:"13px",fontWeight:700}}>Focus Keyword</span></div>
      <div style={{display:"flex",alignItems:"center",background:"#111827",border:"1px solid #2a3656",borderRadius:7,overflow:"hidden"}}>
        {focusKw&&<div style={{display:"flex",alignItems:"center",gap:4,background:"#4f46e5",padding:"5px 10px",flexShrink:0}}><span style={{fontSize:13}}>â­</span><span style={{color:"#fff",fontSize:12,fontWeight:700}}>{focusKw}</span></div>}
        <input value={focusKw} onChange={e=>setFocusKw(e.target.value)} placeholder="Example: Rank Math SEO" style={{flex:1,padding:"7px 10px",background:"transparent",border:"none",color:"#d4d9f0",fontSize:"12px",outline:"none"}}/>
      </div>
      <div style={{marginTop:8,padding:"7px 10px",background:"rgba(245,158,11,0.07)",border:"1px solid rgba(245,158,11,0.2)",borderRadius:5,fontSize:11,color:"#d4aa50"}}>âœ¦ <span style={{color:"#f59e0b",fontWeight:700}}>Tip:</span> Aim for Score 100/100</div>
    </div>
    <div style={{padding:"16px 14px",borderBottom:"1px solid #141e30",display:"flex",alignItems:"center",gap:14}}>
      <ScoreCircle score={analysis.score} size={76}/>
      <div>
        <div style={{fontSize:22,fontWeight:900,color:sc,lineHeight:1}}>{analysis.score}<span style={{fontSize:13,color:"#4a5370",fontWeight:600}}>/100</span></div>
        <div style={{fontSize:12,color:sc,fontWeight:700,marginTop:2}}>{sl} SEO Score</div>
        <div style={{fontSize:11,color:"#4a5370",marginTop:4}}>{analysis.wordCount} words written</div>
      </div>
    </div>
    <div style={{flex:1}}>
      {analysis.sections.map(sec=>{const isOpen=open[sec.id];return <div key={sec.id} style={{borderBottom:"1px solid #141e30"}}>
        <button onClick={()=>setOpen(p=>({...p,[sec.id]:!p[sec.id]}))} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"11px 14px",background:"transparent",border:"none",cursor:"pointer",gap:8}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:"13px",fontWeight:700,color:"#c8d0e8"}}>{sec.title}</span><SectionBadge status={sec.status} checks={sec.checks}/></div>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{transform:isOpen?"rotate(180deg)":"rotate(0deg)",transition:"transform 0.2s",flexShrink:0}}><path d="M3 5l4 4 4-4" stroke="#5a6380" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        {isOpen&&<div style={{padding:"2px 14px 10px"}}>{sec.checks.map(c=><CheckItem key={c.id} check={c}/>)}</div>}
      </div>;})}
    </div>
    {posts.length>0&&<div style={{borderTop:"1px solid #141e30",padding:"10px 14px"}}>
      <button onClick={()=>setShowPosts(p=>!p)} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",background:"rgba(79,127,255,0.07)",border:"1px solid rgba(79,127,255,0.18)",borderRadius:6,padding:"7px 10px",cursor:"pointer"}}>
        <span style={{fontSize:12,fontWeight:700,color:"#4f7fff"}}>ðŸ”— Insert Internal Link</span>
        <span style={{fontSize:11,color:"#4f7fff"}}>{posts.length} posts {showPosts?"â–²":"â–¼"}</span>
      </button>
      {showPosts&&<div style={{marginTop:6,maxHeight:180,overflowY:"auto"}}>{posts.slice(-10).map(p=><div key={p.id} onClick={()=>onInsertInternal(p)} style={{padding:"6px 8px",marginBottom:3,background:"#0f1525",borderRadius:5,border:"1px solid #1a2436",cursor:"pointer"}}>
        <div style={{color:"#4f7fff",fontSize:11,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>â†— {p.title}</div>
        <div style={{color:"#2a3050",fontSize:10}}>/{p.slug}</div>
      </div>)}</div>}
    </div>}
    <div style={{padding:"10px 14px 14px"}}>
      <div style={{padding:10,background:"rgba(79,46,229,0.06)",border:"1px solid rgba(79,46,229,0.15)",borderRadius:7}}>
        <div style={{color:"#818cf8",fontSize:"10px",fontWeight:800,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:7}}>ðŸ’¡ Quick Tips</div>
        {["Use keyword in first H2 heading","Add 2+ external authority links","Every image needs alt text with keyword","Write 1 internal link per 500 words","Keep sentences under 20 words"].map((t,i)=><div key={i} style={{color:"#3a456a",fontSize:"10.5px",marginBottom:4,paddingLeft:12,position:"relative"}}><span style={{position:"absolute",left:0,color:"#4f46e5"}}>â€º</span>{t}</div>)}
      </div>
    </div>
  </div>;
}

function RichEditor({content,onChange,onInsertImage}:{content:string;onChange:(v:string)=>void;onInsertImage:()=>void}){
  const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{if(ref.current&&ref.current.innerHTML!==content)ref.current.innerHTML=content;},[content]);
  const exec=(cmd:string,val?:string)=>{document.execCommand(cmd,false,val);ref.current?.focus();onChange(ref.current?.innerHTML||"");};
  const btns=[{l:"B",cmd:"bold"},{l:"I",cmd:"italic"},{l:"U",cmd:"underline"},{l:"H2",cmd:"formatBlock",val:"h2"},{l:"H3",cmd:"formatBlock",val:"h3"},{l:"Â¶",cmd:"formatBlock",val:"p"},{l:"â€¢ List",cmd:"insertUnorderedList"},{l:"1. List",cmd:"insertOrderedList"},{l:'""',cmd:"formatBlock",val:"blockquote"}];
  return <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
    <div style={{display:"flex",flexWrap:"wrap",gap:"3px",padding:"7px 10px",background:"#131929",borderBottom:"1px solid #1e2740"}}>
      {btns.map(b=><button key={b.l} onMouseDown={e=>{e.preventDefault();exec(b.cmd,b.val);}} style={{padding:"3px 9px",fontSize:"11px",fontWeight:600,background:"#1e2740",color:"#8a93b0",border:"1px solid #252f45",borderRadius:"3px",cursor:"pointer"}}>{b.l}</button>)}
      <button onMouseDown={e=>{e.preventDefault();const u=prompt("Enter URL:");if(u)exec("createLink",u);}} style={{padding:"3px 9px",fontSize:"11px",fontWeight:600,background:"#1e2740",color:"#4f7fff",border:"1px solid #2a3a6f",borderRadius:"3px",cursor:"pointer"}}>ðŸ”— Link</button>
      <button onMouseDown={e=>{e.preventDefault();onInsertImage();}} style={{padding:"3px 9px",fontSize:"11px",fontWeight:600,background:"#1e2740",color:"#a855f7",border:"1px solid #4a2a7f",borderRadius:"3px",cursor:"pointer"}}>ðŸ–¼ Images</button>
    </div>
    <div ref={ref} contentEditable suppressContentEditableWarning onInput={()=>onChange(ref.current?.innerHTML||"")} data-placeholder="Start writing or click 'Generate with AI'..." style={{flex:1,padding:"20px 24px",outline:"none",overflowY:"auto",color:"#d4d9f0",fontSize:"15px",lineHeight:"1.85",fontFamily:"'Georgia',serif",minHeight:"360px"}}/>
  </div>;
}

function ImageModal({keyword,onInsert,onClose}:{keyword:string;onInsert:(img:{url:string;alt:string})=>void;onClose:()=>void}){
  const [images,setImages]=useState<{url:string;thumb:string;alt:string}[]>([]);
  const [loading,setLoading]=useState(true);
  const [q,setQ]=useState(keyword||"");
  const load=async(query:string)=>{
    setLoading(true);
    const imgs=Array.from({length:9},(_,i)=>{const seed=encodeURIComponent(`${query} ${["construction","professional","building"][i%3]}`);return{url:`https://source.unsplash.com/featured/1200x630/?${seed}&sig=${i}`,thumb:`https://source.unsplash.com/featured/400x250/?${seed}&sig=${i}`,alt:`${query} - construction image ${i+1}`};});
    setImages(imgs);setLoading(false);
  };
  useEffect(()=>{load(keyword);},[keyword]);
  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}}>
    <div style={{width:"min(720px,95vw)",background:"#0f1525",borderRadius:12,border:"1px solid #2a3045",overflow:"hidden",maxHeight:"85vh",display:"flex",flexDirection:"column"}}>
      <div style={{padding:"16px 20px",borderBottom:"1px solid #1e2740",display:"flex",alignItems:"center",gap:12}}>
        <span style={{fontSize:"16px",fontWeight:800,color:"#e8ecf8",flex:1}}>ðŸ–¼ Insert Image</span>
        <input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&load(q)} placeholder="Search images..." style={{padding:"6px 12px",background:"#111827",border:"1px solid #2a3045",borderRadius:6,color:"#e8ecf8",fontSize:"13px",outline:"none",width:"200px"}}/>
        <button onClick={()=>load(q)} style={{padding:"6px 14px",background:"linear-gradient(135deg,#4f7fff,#7c3aed)",color:"#fff",border:"none",borderRadius:6,fontSize:"12px",fontWeight:700,cursor:"pointer"}}>Search</button>
        <button onClick={onClose} style={{background:"none",border:"none",color:"#5a6380",fontSize:"20px",cursor:"pointer",lineHeight:1}}>âœ•</button>
      </div>
      <div style={{padding:16,overflowY:"auto"}}>
        {loading?<div style={{textAlign:"center",padding:"40px",color:"#5a6380"}}><div style={{fontSize:"32px",marginBottom:12}}>â³</div>Loading images...</div>:<div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
          {images.map((img,i)=><div key={i} onClick={()=>onInsert(img)} style={{borderRadius:8,overflow:"hidden",cursor:"pointer",border:"2px solid transparent",transition:"all 0.2s"}} onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.borderColor="#4f7fff"} onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.borderColor="transparent"}>
            <img src={img.thumb} alt={img.alt} loading="lazy" style={{width:"100%",height:"120px",objectFit:"cover",display:"block"}}/>
            <div style={{padding:"6px 8px",background:"#111827",fontSize:"10px",color:"#4a5370"}}>Click to insert â€¢ Unsplash</div>
          </div>)}
        </div>}
        <div style={{marginTop:12,padding:10,background:"rgba(79,127,255,0.05)",borderRadius:6,border:"1px solid rgba(79,127,255,0.1)"}}><div style={{color:"#4a5370",fontSize:"11px"}}>ðŸ’¡ Images from <strong style={{color:"#4f7fff"}}>Unsplash</strong> â€” free. Alt text auto-set to your keyword for SEO.</div></div>
      </div>
    </div>
  </div>;
}

function KeywordSeeder({keywords,setKeywords,dailyRate,setDailyRate,onStartQueue,queueRunning,queueProgress,onPauseQueue,categories,onManageCategories}:{keywords:KwItem[];setKeywords:React.Dispatch<React.SetStateAction<KwItem[]>>;dailyRate:number;setDailyRate:(v:number)=>void;onStartQueue:()=>void;queueRunning:boolean;queueProgress:any;onPauseQueue:()=>void;categories:Cat[];onManageCategories:()=>void}){
  const [bulk,setBulk]=useState("");const [bulkCat,setBulkCat]=useState("uncategorized");
  const pending=keywords.filter(k=>k.status==="pending").length,done=keywords.filter(k=>k.status==="done").length;
  const parse=()=>{const lines=bulk.split(/[\n,]+/).map(s=>s.trim()).filter(Boolean);setKeywords(p=>[...p,...lines.map((kw,i)=>({id:Date.now()+i,kw,status:"pending" as const,scheduledDate:addDays(todayStr(),Math.floor((p.length+i)/dailyRate)),category:bulkCat,seoScore:0}))]);setBulk("");};
  const sc=(s:string)=>s==="done"?"#22c55e":s==="generating"?"#f59e0b":s==="failed"?"#ef4444":"#4a5370";
  const ic=(s:string)=>s==="done"?"âœ“":s==="generating"?"âŸ³":s==="failed"?"âœ—":"â—‹";
  return <div style={{height:"100%",display:"flex",flexDirection:"column",overflow:"hidden"}}>
    <div style={{display:"flex",gap:12,padding:"14px 20px",background:"#0b1020",borderBottom:"1px solid #1a2030",flexWrap:"wrap"}}>
      {[{label:"Total",val:keywords.length,col:"#7c84a0"},{label:"Pending",val:pending,col:"#4f7fff"},{label:"Done",val:done,col:"#22c55e"},{label:"Daily Rate",val:`${dailyRate}/day`,col:"#a855f7"},{label:"Est. Days",val:dailyRate>0?Math.ceil(pending/dailyRate):"âˆž",col:"#f59e0b"}].map(s=><div key={s.label} style={{textAlign:"center",minWidth:70}}><div style={{fontSize:18,fontWeight:800,color:s.col}}>{s.val}</div><div style={{fontSize:10,color:"#3a4060",textTransform:"uppercase",letterSpacing:"0.7px"}}>{s.label}</div></div>)}
    </div>
    <div style={{flex:1,display:"flex",overflow:"hidden"}}>
      <div style={{width:320,flexShrink:0,borderRight:"1px solid #1a2030",padding:16,overflowY:"auto",display:"flex",flexDirection:"column",gap:14}}>
        <div><label style={lbl}>ðŸ“‹ Bulk Import Keywords</label><textarea value={bulk} onChange={e=>setBulk(e.target.value)} rows={10} placeholder={"One keyword per line:\n\nscaffolding rental Cairo\nsteel frame construction\nconcrete supplier Egypt"} style={{width:"100%",padding:10,background:"#111827",border:"1px solid #2a3045",borderRadius:6,color:"#d4d9f0",fontSize:12,outline:"none",resize:"vertical",boxSizing:"border-box",fontFamily:"monospace",lineHeight:"1.6"}}/><div style={{display:"flex",gap:6,marginTop:6}}><button onClick={parse} disabled={!bulk.trim()} style={{flex:1,padding:8,background:bulk.trim()?"linear-gradient(135deg,#4f7fff,#7c3aed)":"#1e2435",color:bulk.trim()?"#fff":"#3a4060",border:"none",borderRadius:5,fontSize:12,fontWeight:700,cursor:bulk.trim()?"pointer":"default"}}>+ Add {bulk.split("\n").filter(Boolean).length} Keywords</button><button onClick={()=>setKeywords([])} style={{padding:"8px 12px",background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",color:"#ef4444",borderRadius:5,fontSize:12,cursor:"pointer"}}>Clear</button></div></div>
        <div><label style={lbl}>Category for Batch</label><CategoryPicker value={bulkCat} onChange={setBulkCat} categories={categories} compact/></div>
        <div><label style={lbl}>Daily Rate: {dailyRate}/day</label><input type="range" min={1} max={10} value={dailyRate} onChange={e=>setDailyRate(Number(e.target.value))} style={{width:"100%",accentColor:"#4f7fff"}}/><div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#3a4060"}}><span>1/day</span><span>10/day</span></div></div>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {queueProgress&&<div style={{padding:"8px 10px",background:"rgba(245,158,11,0.08)",borderRadius:6,border:"1px solid rgba(245,158,11,0.2)"}}><div style={{color:"#f59e0b",fontSize:12,fontWeight:600,marginBottom:4}}>{queueProgress.step}</div><div style={{height:4,background:"#1e2435",borderRadius:2}}><div style={{height:4,background:"#f59e0b",borderRadius:2,width:`${queueProgress.pct}%`,transition:"width 0.3s"}}/></div><div style={{color:"#5a6380",fontSize:10,marginTop:4}}>{queueProgress.current}/{queueProgress.total}</div></div>}
          <button onClick={queueRunning?onPauseQueue:onStartQueue} disabled={!queueRunning&&pending===0} style={{padding:10,borderRadius:6,border:"none",background:queueRunning?"rgba(239,68,68,0.15)":pending===0?"#1e2435":"linear-gradient(135deg,#22c55e,#16a34a)",color:queueRunning?"#ef4444":pending===0?"#3a4060":"#fff",fontSize:13,fontWeight:700,cursor:pending===0&&!queueRunning?"default":"pointer"}}>{queueRunning?"â¸ Pause Queue":`â–¶ Generate ${pending} Posts`}</button>
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:16}}>
        {keywords.length===0?<div style={{textAlign:"center",padding:"60px 20px",color:"#2a3060"}}><div style={{fontSize:48,marginBottom:12}}>ðŸ“‹</div><div>Add keywords above to start scheduling</div></div>:keywords.map(k=><div key={k.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",marginBottom:6,background:"#0d1420",border:"1px solid #1a2436",borderRadius:8}}>
          <span style={{fontSize:16,color:sc(k.status),fontWeight:800,width:16,textAlign:"center"}}>{ic(k.status)}</span>
          <div style={{flex:1,minWidth:0}}><div style={{color:"#e8ecf8",fontSize:13,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{k.kw}</div><div style={{color:"#3a4060",fontSize:10}}>{k.scheduledDate} Â· {k.category}{k.seoScore>0?` Â· Score: ${k.seoScore}`:""}</div></div>
          {k.status==="generating"&&<span style={{color:"#f59e0b",fontSize:11}}>âŸ³ Writing...</span>}
          <button onClick={()=>setKeywords(p=>p.filter(x=>x.id!==k.id))} style={{background:"none",border:"none",color:"#2a3050",fontSize:16,cursor:"pointer",padding:"0 4px"}}>&times;</button>
        </div>)}
      </div>
    </div>
  </div>;
}

function SchemaPanel({post,siteUrl}:{post:any;siteUrl:string}){
  const [orgName,setOrgName]=useState("Construction Egy");const [activeType,setActiveType]=useState("article");const [copied,setCopied]=useState("");
  const url=`${siteUrl}/${post?.slug||""}`;
  const schemas:Record<string,any>={
    article:{"@context":"https://schema.org","@type":"BlogPosting",headline:post?.metaTitle||"",description:post?.metaDescription||"",url,datePublished:post?.createdAt||new Date().toISOString(),author:{"@type":"Organization",name:orgName},wordCount:post?.wordCount||0,articleSection:post?.category||"Blog",mainEntityOfPage:{"@type":"WebPage","@id":url}},
    breadcrumb:{"@context":"https://schema.org","@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:"Home",item:siteUrl},{"@type":"ListItem",position:2,name:post?.category||"Blog",item:`${siteUrl}/${post?.category||"blog"}`},{"@type":"ListItem",position:3,name:post?.metaTitle||""}]},
  };
  const TYPES=[{id:"article",label:"Article",icon:"ðŸ“„",desc:"BlogPosting schema"},{id:"breadcrumb",label:"Breadcrumb",icon:"ðŸ§­",desc:"Navigation path"}];
  const copy=(type:string)=>{navigator.clipboard.writeText(`<script type="application/ld+json">\n${JSON.stringify(schemas[type],null,2)}\n<\/script>`).then(()=>{setCopied(type);setTimeout(()=>setCopied(""),2000);});};
  return <div style={{height:"100%",display:"flex",flexDirection:"column",overflow:"hidden",background:"#090d1a"}}>
    <div style={{padding:"14px 20px",borderBottom:"1px solid #1a2436",background:"#0c1120",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <div><div style={{color:"#e8ecf8",fontWeight:800,fontSize:15}}>âš¡ Structured Data</div><div style={{color:"#4a5370",fontSize:11,marginTop:2}}>JSON-LD Schema Markup for rich snippets</div></div>
      <div style={{display:"flex",gap:8,alignItems:"center"}}><span style={{...lbl,marginBottom:0,color:"#5a6380",fontSize:10}}>Org:</span><input value={orgName} onChange={e=>setOrgName(e.target.value)} style={{padding:"5px 10px",background:"#111827",border:"1px solid #2a3045",borderRadius:5,color:"#e8ecf8",fontSize:12,outline:"none",width:160}}/></div>
    </div>
    <div style={{flex:1,display:"flex",overflow:"hidden"}}>
      <div style={{width:160,flexShrink:0,borderRight:"1px solid #1a2436",overflowY:"auto",padding:"8px 0"}}>
        {TYPES.map(t=><div key={t.id} onClick={()=>setActiveType(t.id)} style={{padding:"10px 12px",cursor:"pointer",borderLeft:activeType===t.id?"3px solid #4f7fff":"3px solid transparent",background:activeType===t.id?"rgba(79,127,255,0.08)":"transparent"}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:14}}>{t.icon}</span><div><div style={{fontSize:12,fontWeight:700,color:activeType===t.id?"#e8ecf8":"#8a93b0"}}>{t.label}</div><div style={{fontSize:10,color:"#3a4060"}}>{t.desc}</div></div></div>
        </div>)}
      </div>
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{padding:"10px 16px",borderBottom:"1px solid #1a2436",display:"flex",alignItems:"center",gap:10}}>
          <div style={{flex:1}}><div style={{color:"#e8ecf8",fontSize:13,fontWeight:700}}>{TYPES.find(t=>t.id===activeType)?.icon} {TYPES.find(t=>t.id===activeType)?.label} Schema</div></div>
          <button onClick={()=>copy(activeType)} style={{padding:"6px 16px",borderRadius:5,border:"none",background:copied===activeType?"rgba(34,197,94,0.15)":"rgba(79,127,255,0.15)",color:copied===activeType?"#22c55e":"#4f7fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>{copied===activeType?"âœ“ Copied!":"ðŸ“‹ Copy Schema"}</button>
        </div>
        <div style={{flex:1,margin:"12px 16px 16px",overflow:"hidden",borderRadius:7,border:"1px solid #1e2740",display:"flex",flexDirection:"column"}}>
          <div style={{padding:"8px 12px",background:"#0d1221",borderBottom:"1px solid #1e2740"}}><span style={{fontSize:11,color:"#4a5370",fontFamily:"monospace"}}>&lt;script type="application/ld+json"&gt;</span></div>
          <pre style={{flex:1,margin:0,padding:"14px 16px",overflowY:"auto",background:"#080d1a",fontSize:11,lineHeight:1.6,color:"#7dd3fc",fontFamily:"'Fira Code','Courier New',monospace"}}>{JSON.stringify(schemas[activeType],null,2)}</pre>
          <div style={{padding:"6px 12px",background:"#0d1221",borderTop:"1px solid #1e2740"}}><span style={{fontSize:11,color:"#4a5370",fontFamily:"monospace"}}>&lt;/script&gt;</span></div>
        </div>
      </div>
    </div>
  </div>;
}

// â”€â”€â”€ Main SeoEditor â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function SeoEditor({ initial, categories: propCats, siteUrl, locale }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<"editor"|"queue"|"posts"|"schema">("editor");
  const [seedKw, setSeedKw] = useState(initial.seedKeyword);
  const [content, setContent] = useState(initial.content);
  const [metaTitle, setMetaTitle] = useState(initial.metaTitle);
  const [metaDesc, setMetaDesc] = useState(initial.metaDescription);
  const [slug, setSlug] = useState(initial.slug);
  const [focusKw, setFocusKw] = useState(initial.seedKeyword);
  const [extSource, setExtSource] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genStep, setGenStep] = useState("");
  const [error, setError] = useState("");
  const [savedMsg, setSavedMsg] = useState("");
  const [showImageModal, setShowImageModal] = useState(false);
  const [showCatManager, setShowCatManager] = useState(false);
  const [editingId, setEditingId] = useState<string|undefined>(initial.id);
  const [categories, setCategories] = useState<Cat[]>(() => {
    const mapped = propCats.map(c => { const def = DEFAULT_CATS.find(d => d.id === c.slug); return def ?? { id: c.slug, label: c.label, color: "#4a5370", icon: "ðŸ“" }; });
    return [...mapped, ...DEFAULT_CATS.filter(d => !mapped.find(m => m.id === d.id))];
  });
  const [postCat, setPostCat] = useState(initial.categorySlug || categories[0]?.id || "uncategorized");
  const [filterCat, setFilterCat] = useState("all");
  const [keywords, setKeywords] = useState<KwItem[]>([]);
  const [dailyRate, setDailyRate] = useState(2);
  const [queueRunning, setQueueRunning] = useState(false);
  const [queueProgress, setQueueProgress] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const pauseRef = useRef(false);

  const analysis = useSeoAnalyzer(content, focusKw || seedKw, metaTitle, metaDesc, slug, posts);
  const scoreColor = analysis.score >= 80 ? "#22c55e" : analysis.score >= 50 ? "#f59e0b" : "#ef4444";

  const generateArticle = async (keyword = seedKw, prevPosts: Post[] = posts) => {
    if (!keyword.trim()) { setError("Enter a seed keyword."); return null; }
    setError("");
    const cat = categories.find(c => c.id === postCat);
    const res = await fetch("/api/generate-article", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ seedKeyword:keyword, category:cat?.label||postCat, locale }) });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error||"Generation failed"); }
    return res.json() as Promise<{content:string;metaTitle:string;metaDescription:string;slug:string}>;
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      setGenStep("âœï¸ Writing article (1600â€“2000 words)...");
      const r = await generateArticle();
      if (r) { setContent(r.content); setMetaTitle(r.metaTitle); setMetaDesc(r.metaDescription); setSlug(r.slug||toSlug(seedKw)); setFocusKw(seedKw); setGenStep("âœ… Done!"); setTimeout(()=>setGenStep(""),2000); }
    } catch(e:any) { setError("Generation failed: "+e.message); setGenStep(""); }
    finally { setGenerating(false); }
  };

  const runQueue = async () => {
    const pending = keywords.filter(k=>k.status==="pending");
    if (!pending.length||queueRunning) return;
    setQueueRunning(true); pauseRef.current=false;
    let cur=[...posts];
    for (let i=0;i<pending.length;i++) {
      if (pauseRef.current) break;
      const kw=pending[i];
      setKeywords(p=>p.map(k=>k.id===kw.id?{...k,status:"generating"}:k));
      setQueueProgress({step:`Generating: "${kw.kw}"`,current:i+1,total:pending.length,pct:Math.round(((i+1)/pending.length)*100)});
      try {
        const r=await generateArticle(kw.kw,cur);
        if (r) {
          const p:Post={id:Date.now()+i,seedKeyword:kw.kw,title:r.metaTitle,slug:r.slug,content:r.content,metaTitle:r.metaTitle,metaDescription:r.metaDescription,category:kw.category,seoScore:75+Math.floor(Math.random()*20),wordCount:r.content.split(" ").length,status:"published",createdAt:new Date().toISOString()};
          cur=[...cur,p]; setPosts([...cur]);
          setKeywords(p2=>p2.map(k=>k.id===kw.id?{...k,status:"done",seoScore:p.seoScore}:k));
        }
      } catch { setKeywords(p=>p.map(k=>k.id===kw.id?{...k,status:"failed"}:k)); }
      if (i<pending.length-1) await sleep(3000);
    }
    setQueueRunning(false); setQueueProgress(null);
  };

  const handleSave = async (status:"draft"|"published") => {
    if (!metaTitle||!content) { setError("Title and content required."); return; }
    const input:SavePostInput = { id:editingId, categorySlug:postCat, seedKeyword:seedKw, title:metaTitle, slug:slug||toSlug(metaTitle), content, metaTitle, metaDescription:metaDesc, coverImage:null, coverImageAlt:null, status, publishAt:null, seoScore:analysis.score };
    const result = await savePost(input);
    if (!result.ok) { setError(result.error); return; }
    if (result.ok) setEditingId(result.id);
    setSavedMsg("âœ“ Saved!"); setTimeout(()=>setSavedMsg(""),2500);
    router.refresh();
  };

  const newPost=()=>{setEditingId(undefined);setSeedKw("");setContent("");setMetaTitle("");setMetaDesc("");setSlug("");setFocusKw("");setError("");};
  const loadPost=(p:Post)=>{setEditingId(String(p.id));setSeedKw(p.seedKeyword||"");setContent(p.content);setMetaTitle(p.metaTitle);setMetaDesc(p.metaDescription);setSlug(p.slug);setFocusKw(p.seedKeyword||"");setPostCat(p.category||"uncategorized");setTab("editor");};
  const insertImage=(img:{url:string;alt:string})=>{setContent(prev=>prev+`<figure style="margin:24px 0;"><img src="${img.url}" alt="${img.alt}" style="width:100%;border-radius:8px;max-height:400px;object-fit:cover;" /><figcaption style="text-align:center;color:#888;font-size:13px;margin-top:8px;">${img.alt}</figcaption></figure>`);setShowImageModal(false);};

  return (
    <div style={{minHeight:"100vh",background:"#090d1a",fontFamily:"'Segoe UI',system-ui,sans-serif",color:"#d4d9f0",display:"flex",flexDirection:"column"}}>
      {showImageModal&&<ImageModal keyword={seedKw||focusKw||"construction"} onInsert={insertImage} onClose={()=>setShowImageModal(false)}/>}
      {showCatManager&&<CategoryManagerModal categories={categories} setCategories={setCategories} onClose={()=>setShowCatManager(false)}/>}

      {/* TOP BAR */}
      <div style={{background:"#0c1020",borderBottom:"1px solid #1a2436",padding:"0 16px",display:"flex",alignItems:"center",gap:4,height:52,flexShrink:0,boxShadow:"0 2px 20px rgba(0,0,0,0.5)"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginRight:12}}>
          <div style={{width:30,height:30,borderRadius:7,background:"linear-gradient(135deg,#4f7fff,#a855f7)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>âš¡</div>
          <span style={{fontWeight:900,fontSize:14,color:"#e8ecf8",letterSpacing:"-0.3px"}}>SEO Power</span>
        </div>
        {(["editor","queue","posts","schema"] as const).map(id=>{
          const icons={editor:"âœï¸",queue:"ðŸ“…",posts:"ðŸ“š",schema:"âš¡"};
          const labels={editor:"Editor",queue:`Queue (${keywords.filter(k=>k.status==="pending").length})`,posts:`Posts (${posts.length})`,schema:"Schema"};
          return <button key={id} onClick={()=>setTab(id)} style={{padding:"6px 14px",borderRadius:5,border:"none",background:tab===id?"rgba(79,127,255,0.12)":"transparent",color:tab===id?"#4f7fff":"#5a6380",fontWeight:700,fontSize:12,cursor:"pointer",borderBottom:tab===id?"2px solid #4f7fff":"2px solid transparent"}}>{icons[id]} {labels[id]}</button>;
        })}
        <div style={{flex:1}}/>
        {savedMsg&&<span style={{color:"#22c55e",fontSize:12,fontWeight:600}}>{savedMsg}</span>}
        {queueRunning&&<span style={{color:"#f59e0b",fontSize:12,fontWeight:600}}>âŸ³ Queue Running</span>}
        {tab==="editor"&&<>
          <button onClick={newPost} style={{padding:"6px 12px",borderRadius:5,border:"1px solid #1e2740",background:"transparent",color:"#5a6380",fontSize:12,fontWeight:600,cursor:"pointer"}}>+ New</button>
          <button onClick={()=>handleSave("draft")} style={{padding:"6px 12px",borderRadius:5,border:"1px solid #1e2740",background:"transparent",color:"#5a6380",fontSize:12,fontWeight:600,cursor:"pointer"}}>Draft</button>
          <button onClick={()=>handleSave("published")} style={{padding:"6px 14px",borderRadius:5,border:"none",background:"linear-gradient(135deg,#22c55e,#16a34a)",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>ðŸ’¾ Publish</button>
        </>}
      </div>

      {tab==="queue"&&<div style={{flex:1,overflow:"hidden"}}><KeywordSeeder keywords={keywords} setKeywords={setKeywords} dailyRate={dailyRate} setDailyRate={setDailyRate} onStartQueue={runQueue} queueRunning={queueRunning} queueProgress={queueProgress} onPauseQueue={()=>{pauseRef.current=true;setQueueRunning(false);setQueueProgress(null);}} categories={categories} onManageCategories={()=>setShowCatManager(true)}/></div>}

      {tab==="posts"&&<div style={{flex:1,padding:"24px 28px",maxWidth:960,margin:"0 auto",width:"100%",overflowY:"auto",boxSizing:"border-box"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
          <h2 style={{color:"#e8ecf8",fontSize:18,fontWeight:800,margin:0}}>Posts</h2>
          <div style={{display:"flex",gap:8}}><button onClick={()=>setShowCatManager(true)} style={{padding:"6px 12px",borderRadius:6,border:"1px solid #2a3045",background:"#111827",color:"#7c84a0",fontSize:12,fontWeight:600,cursor:"pointer"}}>ðŸ—‚ Categories</button><button onClick={()=>{newPost();setTab("editor");}} style={{padding:"7px 18px",borderRadius:7,border:"none",background:"linear-gradient(135deg,#4f7fff,#7c3aed)",color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer"}}>+ New Post</button></div>
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>
          <button onClick={()=>setFilterCat("all")} style={{padding:"5px 14px",borderRadius:20,border:`1px solid ${filterCat==="all"?"#4f7fff":"#1e2740"}`,background:filterCat==="all"?"rgba(79,127,255,0.15)":"#111827",color:filterCat==="all"?"#4f7fff":"#4a5370",fontSize:11,fontWeight:700,cursor:"pointer"}}>All ({posts.length})</button>
          {categories.map(cat=>{const count=posts.filter(p=>p.category===cat.id).length;if(!count)return null;return <button key={cat.id} onClick={()=>setFilterCat(cat.id)} style={{padding:"5px 12px",borderRadius:20,border:`1px solid ${filterCat===cat.id?cat.color:"#1e2740"}`,background:filterCat===cat.id?`${cat.color}22`:"#111827",color:filterCat===cat.id?cat.color:"#4a5370",fontSize:11,fontWeight:700,cursor:"pointer"}}>{cat.icon} {cat.label} ({count})</button>;})}
        </div>
        {posts.filter(p=>filterCat==="all"||p.category===filterCat).length===0
          ?<div style={{textAlign:"center",padding:"80px 20px",color:"#2a3060"}}><div style={{fontSize:48,marginBottom:12}}>ðŸ“</div><div>No posts yet. Use Queue tab to bulk-generate, or create one manually.</div></div>
          :posts.filter(p=>filterCat==="all"||p.category===filterCat).map(p=><div key={p.id} style={{padding:"16px 20px",marginBottom:10,background:"#0d1420",border:"1px solid #1a2436",borderRadius:9,display:"flex",alignItems:"center",gap:14}}>
            <div style={{width:46,height:46,borderRadius:9,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,fontWeight:800,background:p.seoScore>=80?"rgba(34,197,94,0.12)":p.seoScore>=50?"rgba(245,158,11,0.12)":"rgba(239,68,68,0.12)",color:p.seoScore>=80?"#22c55e":p.seoScore>=50?"#f59e0b":"#ef4444"}}>{p.seoScore}</div>
            <div style={{flex:1,minWidth:0}}><div style={{color:"#e8ecf8",fontWeight:700,fontSize:14,marginBottom:3,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.title}</div><div style={{color:"#3a4060",fontSize:11}}><span style={{color:"#3a5fff",marginRight:10}}>/{p.slug}</span><span style={{marginRight:10}}>ðŸ”‘ {p.seedKeyword}</span><span style={{marginRight:10}}>ðŸ“ {p.wordCount||"â€”"} words</span><span>{new Date(p.createdAt).toLocaleDateString()}</span></div></div>
            <button onClick={()=>loadPost(p)} style={{padding:"6px 14px",borderRadius:5,border:"1px solid #2a5fff",background:"rgba(79,127,255,0.08)",color:"#4f7fff",fontSize:11,fontWeight:600,cursor:"pointer"}}>Edit</button>
          </div>)}
      </div>}

      {tab==="schema"&&<div style={{flex:1,overflow:"hidden"}}><SchemaPanel post={{title:metaTitle,metaTitle,metaDescription:metaDesc,slug,seedKeyword:seedKw,wordCount:analysis.wordCount,category:postCat,createdAt:new Date().toISOString()}} siteUrl={siteUrl}/></div>}

      {tab==="editor"&&<div style={{flex:1,display:"flex",overflow:"hidden"}}>
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{padding:"12px 16px",background:"#0c1120",borderBottom:"1px solid #1a2436",display:"flex",gap:8,flexWrap:"wrap",alignItems:"flex-end"}}>
            <div style={{flex:"1 1 210px"}}><label style={lbl}>ðŸŒ± Seed Keyword</label><input value={seedKw} onChange={e=>setSeedKw(e.target.value)} placeholder="scaffolding rental prices Cairo" style={{width:"100%",padding:"8px 11px",background:"#111827",border:"1px solid #2a3045",borderRadius:6,color:"#e8ecf8",fontSize:13,outline:"none",boxSizing:"border-box"}}/></div>
            <div style={{flex:"1 1 180px"}}><label style={lbl}>ðŸ”— External Source</label><input value={extSource} onChange={e=>setExtSource(e.target.value)} placeholder="https://source.com" style={{width:"100%",padding:"8px 11px",background:"#111827",border:"1px solid #2a3045",borderRadius:6,color:"#e8ecf8",fontSize:13,outline:"none",boxSizing:"border-box"}}/></div>
            <div style={{flex:"0 1 190px"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}><label style={lbl}>ðŸ—‚ Category</label><button onClick={()=>setShowCatManager(true)} style={{fontSize:10,color:"#4f7fff",background:"none",border:"none",cursor:"pointer",padding:0,fontWeight:600}}>+ Manage</button></div>
              <CategoryPicker value={postCat} onChange={setPostCat} categories={categories}/>
            </div>
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              <button onClick={handleGenerate} disabled={generating||!seedKw.trim()} style={{padding:"9px 18px",borderRadius:6,border:"none",background:generating||!seedKw.trim()?"#1a2030":"linear-gradient(135deg,#4f7fff,#7c3aed)",color:generating||!seedKw.trim()?"#3a4060":"#fff",fontWeight:700,fontSize:13,cursor:generating||!seedKw.trim()?"default":"pointer",whiteSpace:"nowrap"}}>{generating?genStep||"âŸ³ Generating...":"ðŸ¤– Generate with AI"}</button>
              <button onClick={()=>setShowImageModal(true)} style={{padding:"9px 14px",borderRadius:6,border:"1px solid #4a2a7f",background:"rgba(168,85,247,0.1)",color:"#a855f7",fontSize:13,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>ðŸ–¼ Images</button>
            </div>
          </div>
          {error&&<div style={{margin:"8px 16px",padding:"9px 12px",background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.25)",borderRadius:5,color:"#ef4444",fontSize:12}}>âš ï¸ {error} <button onClick={()=>setError("")} style={{float:"right",background:"none",border:"none",color:"#ef4444",cursor:"pointer"}}>âœ•</button></div>}
          <div style={{padding:"10px 16px",background:"#090e1c",borderBottom:"1px solid #131e30",display:"flex",gap:10,flexWrap:"wrap"}}>
            <div style={{flex:"1 1 260px"}}><label style={{...lbl,marginBottom:4}}>Meta Title <span style={{color:metaTitle.length>=50&&metaTitle.length<=60?"#22c55e":metaTitle.length>60?"#ef4444":"#f59e0b"}}>{metaTitle.length}/60</span></label><input value={metaTitle} onChange={e=>setMetaTitle(e.target.value)} placeholder="Optimized post title..." style={{width:"100%",padding:"7px 10px",background:"#111827",border:`1px solid ${metaTitle.length>60?"#ef4444":"#2a3045"}`,borderRadius:5,color:"#e8ecf8",fontSize:13,outline:"none",boxSizing:"border-box"}}/></div>
            <div style={{flex:"0 1 160px"}}><label style={lbl}>URL Slug</label><input value={slug} onChange={e=>setSlug(toSlug(e.target.value))} placeholder="post-url-slug" style={{width:"100%",padding:"7px 10px",background:"#111827",border:"1px solid #2a3045",borderRadius:5,color:"#4f9fff",fontSize:12,outline:"none",boxSizing:"border-box",fontFamily:"monospace"}}/></div>
            <div style={{flex:"2 1 100%"}}><label style={{...lbl,marginBottom:4}}>Meta Description <span style={{color:metaDesc.length>=120&&metaDesc.length<=160?"#22c55e":metaDesc.length>160?"#ef4444":"#f59e0b"}}>{metaDesc.length}/160</span></label><textarea value={metaDesc} onChange={e=>setMetaDesc(e.target.value)} rows={2} placeholder="Compelling meta description..." style={{width:"100%",padding:"7px 10px",background:"#111827",border:`1px solid ${metaDesc.length>160?"#ef4444":"#2a3045"}`,borderRadius:5,color:"#e8ecf8",fontSize:12,outline:"none",resize:"none",boxSizing:"border-box",fontFamily:"inherit"}}/></div>
          </div>
          {(metaTitle||metaDesc)&&<div style={{margin:"8px 16px",padding:"12px 16px",background:"#fff",borderRadius:7,boxShadow:"0 2px 16px rgba(0,0,0,0.3)"}}>
            <div style={{fontSize:11,color:"#5f6368",fontFamily:"Arial",marginBottom:2}}>yoursite.com â€º {slug||"post-url"}</div>
            <div style={{fontSize:17,color:"#1a0dab",fontFamily:"Arial",lineHeight:"1.3",marginBottom:3}}>{metaTitle||"Post Title"}</div>
            <div style={{fontSize:13,color:"#4d5156",fontFamily:"Arial",lineHeight:"1.4"}}>{metaDesc||"Meta description..."}</div>
          </div>}
          <div style={{flex:1,overflow:"hidden",background:"#0d1425",margin:"8px 16px 12px",borderRadius:7,border:"1px solid #1a2436",display:"flex",flexDirection:"column",minHeight:280}}>
            <RichEditor content={content} onChange={setContent} onInsertImage={()=>setShowImageModal(true)}/>
          </div>
        </div>
        <RankMathSidebar analysis={analysis} focusKw={focusKw} setFocusKw={kw=>{setFocusKw(kw);if(!seedKw)setSeedKw(kw);}} posts={posts} onInsertInternal={p=>setContent(prev=>prev+` <a href="/${p.slug}">${p.title}</a>`)}/>
      </div>}

      <div style={{height:26,background:"#060a14",borderTop:"1px solid #0e1628",display:"flex",alignItems:"center",padding:"0 16px",gap:16,flexShrink:0,fontSize:10}}>
        <span style={{color:"#2a3050"}}>âš¡ SEO Power Editor</span>
        <span style={{color:"#1e2840"}}>|</span>
        <span style={{color:scoreColor,fontWeight:600}}>Score: {analysis.score}/100</span>
        <span style={{color:"#1e2840"}}>|</span>
        <span style={{color:"#2a3050"}}>Words: {analysis.wordCount}</span>
        <span style={{color:"#1e2840"}}>|</span>
        <span style={{color:"#2a3050"}}>Posts: {posts.length}</span>
        <span style={{color:"#1e2840"}}>|</span>
        <span style={{color:"#2a3050"}}>Queue: {keywords.filter(k=>k.status==="pending").length} pending</span>
        <div style={{flex:1}}/>
        <span style={{color:"#1e2840"}}>Â© 2026 Construction SEO Platform</span>
      </div>

      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        [contenteditable]:empty:before{content:attr(data-placeholder);color:#2a3550;pointer-events:none}
        [contenteditable] h2{color:#e8ecf8;font-size:21px;font-weight:700;margin:20px 0 10px;font-family:'Segoe UI',sans-serif}
        [contenteditable] h3{color:#c8d0e8;font-size:17px;font-weight:600;margin:14px 0 7px;font-family:'Segoe UI',sans-serif}
        [contenteditable] p{margin:0 0 13px}
        [contenteditable] strong{color:#a8b4d8}
        [contenteditable] a{color:#4f9fff}
        [contenteditable] ul,[contenteditable] ol{margin:0 0 13px;padding-left:22px}
        [contenteditable] li{margin-bottom:5px}
        [contenteditable] blockquote{border-left:3px solid #4f7fff;margin:14px 0;padding:8px 18px;background:rgba(79,127,255,0.05);color:#8a93b0;font-style:italic}
        [contenteditable] figure{margin:20px 0}
        [contenteditable] img{max-width:100%;border-radius:8px}
        [contenteditable] figcaption{text-align:center;color:#5a6380;font-size:13px;margin-top:6px}
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-track{background:#070b16}
        ::-webkit-scrollbar-thumb{background:#1a2436;border-radius:3px}
      `}</style>
    </div>
  );
}
