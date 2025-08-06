import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, X } from "lucide-react";
import { useClassesByGym, useBookClass } from "@/hooks/useClasses";
import ClassCard from "./ClassCard";

interface StudioClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  gymId: string;
  gymName: string;
}

const StudioClassModal = ({ isOpen, onClose, gymId, gymName }: StudioClassModalProps) => {
  const { data: classes, isLoading, error } = useClassesByGym(gymId);
  const bookClass = useBookClass();

  const handleBookClass = async (classId: string) => {
    try {
      await bookClass.mutateAsync({ classId });
    } catch (error) {
      console.error("Booking failed:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">
              Classes at {gymName}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading classes...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-destructive">Failed to load classes</p>
            </div>
          ) : !classes || classes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No classes available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {classes.map((classItem) => (
                <ClassCard
                  key={classItem.id}
                  {...classItem}
                  onBook={handleBookClass}
                />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StudioClassModal;