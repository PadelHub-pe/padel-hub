"use client";

import { WaitlistForm } from "./waitlist-form";

export function NewsletterSignup() {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Mantente informado</p>
      <WaitlistForm source="footer-newsletter" compact />
    </div>
  );
}
