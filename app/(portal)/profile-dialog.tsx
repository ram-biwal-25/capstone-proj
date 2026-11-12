"use client";

import React, { useState, useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import type { Farm, PortalUser } from "@/lib/types";
import styles from "./profile-dialog.module.css";
import portalStyles from "./portal.module.css";

interface ProfileDialogProps {
  user: PortalUser;
  farms: Farm[];
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated?: (updatedUser: PortalUser, updatedFarms: Farm[]) => void;
}

const emptySubscribe = () => () => {};

export function ProfileDialog({
  user,
  farms: initialFarms,
  isOpen,
  onClose,
  onProfileUpdated,
}: ProfileDialogProps) {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const [animalCounts, setAnimalCounts] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    for (const f of initialFarms) {
      map[f.id] = f.animalCount ?? (f.type === "pig" ? 250 : 1200);
    }
    return map;
  });
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !isMounted) return null;

  const handleCountChange = (farmId: string, value: number) => {
    setAnimalCounts((prev) => ({
      ...prev,
      [farmId]: Math.max(0, Math.floor(value) || 0),
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setStatusMsg(null);
    try {
      const updates = initialFarms.map((farm) => ({
        farmId: farm.id,
        count: animalCounts[farm.id] ?? (farm.type === "pig" ? 250 : 1200),
      }));

      const res = await fetch("/api/farms/count", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMsg("Livestock count updated successfully!");
        if (onProfileUpdated) {
          const updatedFarms = initialFarms.map((f) => ({
            ...f,
            animalCount: animalCounts[f.id] ?? (f.type === "pig" ? 250 : 1200),
          }));
          onProfileUpdated(user, updatedFarms);
        }
        setTimeout(() => setStatusMsg(null), 3000);
      } else {
        setStatusMsg(data.error || "Failed to update count.");
      }
    } catch {
      setStatusMsg("An error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  // Summary calculations
  const totalPigs = initialFarms
    .filter((f) => f.type === "pig")
    .reduce((sum, f) => sum + (animalCounts[f.id] ?? 250), 0);
  const totalBirds = initialFarms
    .filter((f) => f.type === "poultry")
    .reduce((sum, f) => sum + (animalCounts[f.id] ?? 1200), 0);
  const totalHead = totalPigs + totalBirds;

  const farmTypeSummary = Array.from(
    new Set(initialFarms.map((f) => (f.type === "pig" ? "Pig Farm" : "Poultry Farm"))),
  ).join(" & ");

  const modalContent = (
    <div
      className={styles.backdrop}
      onClick={(e) => {
        // Clicking anywhere outside the mini window closes it
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        className={styles.miniWindow}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mini-profile-title"
      >
        {/* Header */}
        <div className={styles.windowHeader}>
          <div className={styles.headerTitleGroup}>
            <div className={styles.headerAvatar} aria-hidden="true">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className={styles.headerText}>
              <h2 id="mini-profile-title">Farmer Profile</h2>
              <p>Biosecurity Livestock Records</p>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close window"
            title="Close"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className={styles.windowBody}>
          {statusMsg && (
            <div className={styles.statusMessage}>
              <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{statusMsg}</span>
            </div>
          )}

          {/* Farmer Details (Read-only) */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Farmer Details</h3>
            <div className={styles.readOnlyGrid}>
              <div className={styles.readOnlyCard}>
                <small>Farmer Name</small>
                <strong>{user.name}</strong>
              </div>
              <div className={styles.readOnlyCard}>
                <small>Email Address</small>
                <strong>{user.email}</strong>
              </div>
              <div className={styles.readOnlyCard}>
                <small>Type of Farm</small>
                <strong>{farmTypeSummary || "Pig / Poultry"}</strong>
              </div>
              <div className={styles.readOnlyCard}>
                <small>Livestock Total</small>
                <strong>{totalHead.toLocaleString()} Head</strong>
              </div>
            </div>
          </div>

          {/* Farms & Animals/Birds Count (Editable count only) */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Livestock & Bird Capacity (Editable)</h3>
            {initialFarms.map((farm) => {
              const isPig = farm.type === "pig";
              const currentCount = animalCounts[farm.id] ?? (isPig ? 250 : 1200);

              return (
                <div className={styles.farmCard} key={farm.id}>
                  <div className={styles.farmHeader}>
                    <div className={styles.farmInfo}>
                      <span className={styles.farmIcon} aria-hidden="true">
                        {isPig ? "🐷" : "🐔"}
                      </span>
                      <div className={styles.farmTitleText}>
                        <h4>{farm.name}</h4>
                        <p>{isPig ? "Pig Farm (Swine)" : "Poultry Farm (Avian)"}</p>
                      </div>
                    </div>
                    <span className={styles.farmRolePill}>{farm.accessRole}</span>
                  </div>

                  <div className={styles.editableRow}>
                    <div className={styles.editableLabel}>
                      <span>{isPig ? "Number of Animals (Pigs):" : "Number of Birds (Poultry):"}</span>
                      <small>Enter verified herd/flock count</small>
                    </div>
                    <div className={styles.countInputWrapper}>
                      <input
                        id={`farm-count-${farm.id}`}
                        type="number"
                        min={0}
                        className={styles.countInput}
                        value={currentCount}
                        onChange={(e) => handleCountChange(farm.id, Number(e.target.value))}
                      />
                      <span className={styles.countUnit}>{isPig ? "pigs" : "birds"}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className={styles.summaryPill}>
            <span>Total Farm Livestock Capacity:</span>
            <strong>
              {totalPigs.toLocaleString()} Pigs · {totalBirds.toLocaleString()} Birds
            </strong>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.windowFooter}>
          <form action="/api/auth/logout" method="post" className={styles.logoutForm}>
            <button
              type="submit"
              className={styles.logoutBtn}
              aria-label="Sign out"
              title="Sign out of account"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9 5H5v14h4M14 8l4 4-4 4M8 12h10" />
              </svg>
              <span>Log out</span>
            </button>
          </form>

          <div className={styles.actionButtonGroup}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className={styles.saveBtn}
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Count"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

export function SidebarAccount({ user, farms }: { user: PortalUser; farms: Farm[] }) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<PortalUser>(user);
  const [currentFarms, setCurrentFarms] = useState<Farm[]>(farms);

  const handleProfileUpdated = (updatedUser: PortalUser, updatedFarms: Farm[]) => {
    setCurrentUser(updatedUser);
    setCurrentFarms(updatedFarms);
  };

  return (
    <>
      <div className={portalStyles.sidebarAccount}>
        {/* Clickable Logo S */}
        <button
          type="button"
          className={portalStyles.avatarBtn}
          onClick={() => setIsProfileOpen(true)}
          aria-label={`Open profile for ${currentUser.name}`}
          title="Click S to view profile"
        >
          {currentUser.name.charAt(0).toUpperCase()}
        </button>

        {/* Clickable Name & Email */}
        <button
          type="button"
          className={portalStyles.accountTextBtn}
          onClick={() => setIsProfileOpen(true)}
          aria-label={`Open profile for ${currentUser.name}`}
          title="Click name or email to view profile"
        >
          <strong>{currentUser.name}</strong>
          <span>{currentUser.email}</span>
        </button>

        {/* Direct sign out button next to Sample Farmer */}
        <form action="/api/auth/logout" method="post">
          <button
            type="submit"
            className={portalStyles.signOutBtn}
            aria-label="Sign out"
            title="Sign out"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 5H5v14h4M14 8l4 4-4 4M8 12h10" />
            </svg>
          </button>
        </form>
      </div>

      {isProfileOpen && (
        <ProfileDialog
          key={`${currentUser.name}-${currentUser.email}-${isProfileOpen}`}
          user={currentUser}
          farms={currentFarms}
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          onProfileUpdated={handleProfileUpdated}
        />
      )}
    </>
  );
}

export function MobileAccountButton({ user, farms }: { user: PortalUser; farms: Farm[] }) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<PortalUser>(user);
  const [currentFarms, setCurrentFarms] = useState<Farm[]>(farms);

  const handleProfileUpdated = (updatedUser: PortalUser, updatedFarms: Farm[]) => {
    setCurrentUser(updatedUser);
    setCurrentFarms(updatedFarms);
  };

  return (
    <>
      <button
        type="button"
        className={styles.mobileAccountBtn}
        onClick={() => setIsProfileOpen(true)}
        aria-label={`Open profile for ${currentUser.name}`}
        title="View profile"
      >
        <span>{currentUser.name.charAt(0).toUpperCase()}</span>
      </button>

      {isProfileOpen && (
        <ProfileDialog
          key={`${currentUser.name}-${currentUser.email}-${isProfileOpen}`}
          user={currentUser}
          farms={currentFarms}
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          onProfileUpdated={handleProfileUpdated}
        />
      )}
    </>
  );
}
