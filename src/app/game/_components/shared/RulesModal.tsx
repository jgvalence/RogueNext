"use client";

import { RogueModal } from "@/components/ui/rogue";
import { RulesContent } from "@/components/rules/RulesContent";

interface RulesModalProps {
  onClose: () => void;
}

export function RulesModal({ onClose }: RulesModalProps) {
  return (
    <RogueModal
      open
      onCancel={onClose}
      footer={null}
      width={1200}
      centered
      destroyOnClose
      className="[&_.ant-modal-body]:!px-3 [&_.ant-modal-body]:!py-4 sm:[&_.ant-modal-body]:!px-5 sm:[&_.ant-modal-body]:!py-5 [&_.ant-modal-close]:!text-slate-300 [&_.ant-modal-content]:!rounded-2xl [&_.ant-modal-content]:!border [&_.ant-modal-content]:!border-slate-700 [&_.ant-modal-content]:!bg-slate-900/95"
    >
      <RulesContent mode="modal" onClose={onClose} />
    </RogueModal>
  );
}
