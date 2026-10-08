"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface DeleteCustomerButtonProps {
  customerId: string;
  customerName: string;
}

export const DeleteCustomerButton: React.FC<DeleteCustomerButtonProps> = ({
  customerId,
  customerName,
}) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/merchant/customers/${customerId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/dashboard/customers");
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete customer.");
        setIsDeleting(false);
        setShowConfirm(false);
      }
    } catch {
      alert("Failed to delete customer due to a network error.");
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowConfirm(true)}
        className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 gap-1.5 text-xs font-semibold"
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span>Delete Customer Data</span>
      </Button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Delete Customer Data?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to permanently delete records for <strong>{customerName}</strong>? All reward history and notifications tokens will be removed.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleDelete}
                isLoading={isDeleting}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

