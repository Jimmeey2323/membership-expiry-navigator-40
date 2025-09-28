import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MembershipData } from "@/types/membership";

interface TestEditModalProps {
  member: MembershipData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TestEditModal = ({ member, open, onOpenChange }: TestEditModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Test Edit Modal</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p>Member: {member?.firstName} {member?.lastName}</p>
          <p>Email: {member?.email}</p>
          <Button onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};