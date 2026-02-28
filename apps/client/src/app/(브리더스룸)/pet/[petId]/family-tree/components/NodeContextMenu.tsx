"use client";

import { useEffect, useRef } from "react";

interface NodeContextMenuProps {
  nodeId: string;
  nodeName: string;
  isPrivate?: boolean;
  isOwner?: boolean;
  nodeSex?: string;
  position: { x: number; y: number };
  onAction: (action: string, nodeId: string) => void;
  onClose: () => void;
}

const MENU_ITEMS = [
  { action: "detail", label: "개체 상세 보기" },
  { action: "select-mate", label: "메이팅 개체 선택" },
  { action: "relation", label: "관계도 보기" },
  { action: "family-tree", label: "이 개체의 가계도" },
] as const;

export default function NodeContextMenu({
  nodeId,
  nodeName,
  isPrivate,
  isOwner,
  nodeSex,
  position,
  onAction,
  onClose,
}: NodeContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // ESC 키로 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  // 뷰포트 밖으로 나가지 않도록 위치 보정
  useEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;
    const rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      menu.style.left = `${position.x - rect.width}px`;
    }
    if (rect.bottom > window.innerHeight) {
      menu.style.top = `${position.y - rect.height}px`;
    }
  }, [position]);

  return (
    <div
      ref={menuRef}
      className="animate-in fade-in zoom-in-95 fixed z-50 min-w-[160px] overflow-hidden rounded-lg border border-gray-200 bg-white/95 py-1 shadow-xl backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/95"
      style={{ left: position.x, top: position.y }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* 헤더 */}
      <div className="border-b border-gray-100 px-3 pb-1.5 dark:border-gray-800">
        <span className="text-[11px] font-medium dark:text-gray-400">{nodeName}</span>
      </div>

      {/* 메뉴 항목 */}
      {MENU_ITEMS.filter((item) => {
        if (isPrivate && (item.action === "detail" || item.action === "select-mate")) return false;
        if (item.action === "select-mate") {
          if (!isOwner) return false;
          const hasMFSex =
            nodeSex === "M" || nodeSex === "MALE" || nodeSex === "F" || nodeSex === "FEMALE";
          if (!hasMFSex) return false;
        }
        return true;
      }).map((item) => (
        <button
          key={item.action}
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
          onClick={() => onAction(item.action, nodeId)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
