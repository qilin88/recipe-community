'use client';
import { useEffect,useRef } from 'react';
import { X } from 'lucide-react';
export default function Modal({children,title,onClose,wide=false}:{children:React.ReactNode;title:string;onClose:()=>void;wide?:boolean}) {
  const ref=useRef<HTMLDivElement>(null);
  const close=useRef(onClose);close.current=onClose;
  useEffect(()=>{
    const previous=document.activeElement as HTMLElement|null,overflow=document.body.style.overflow;
    document.body.style.overflow='hidden';ref.current?.focus();
    const key=(event:KeyboardEvent)=>{
      if(event.key==='Escape') close.current();
      if(event.key==='Tab') {
        const elements=ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),textarea:not(:disabled),select:not(:disabled),[tabindex="0"]');
        if(!elements?.length)return;
        const first=elements[0],last=elements[elements.length-1];
        if(event.shiftKey&&(document.activeElement===first||document.activeElement===ref.current)){event.preventDefault();last.focus();}
        else if(!event.shiftKey&&(document.activeElement===last||document.activeElement===ref.current)){event.preventDefault();first.focus();}
      }
    };
    document.addEventListener('keydown',key);
    return()=>{document.body.style.overflow=overflow;document.removeEventListener('keydown',key);previous?.focus();};
  },[]);
  return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}><div ref={ref} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} className={`modal ${wide?'modal-wide':''}`}><button className="icon-button modal-close" onClick={onClose} aria-label="关闭"><X size={20}/></button>{children}</div></div>;
}
