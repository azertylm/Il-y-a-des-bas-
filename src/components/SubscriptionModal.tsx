import React from "react";
import { AlphabetteAccount, AlphabettePlanType } from "../types";

/**
 * Fenêtre des tarifs.
 *
 * Volontairement simple et sans rien de simulé : pas de faux paiement, pas de
 * formule « activée » d'un clic, pas de code promotionnel. Tant que le paiement
 * en ligne n'est pas ouvert, elle le dit et rappelle les tarifs prévus.
 */
interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPlan?: AlphabettePlanType;
  onAccountCreated?: (account: AlphabetteAccount) => void;
  onOpenAccountModal?: () => void;
}

export function SubscriptionModal({ isOpen, onClose }: SubscriptionModalProps) {
  if (!isOpen) return null;
  return (
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70"
        role="dialog"
        aria-modal="true"
        aria-label="Tarifs Alphabette"
        onClick={onClose}
      >
        <div
          className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white text-slate-900 p-6 shadow-2xl space-y-4 text-left"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-2xl font-extrabold">Combien ça coûte ?</h2>
          <p className="text-base leading-relaxed rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-emerald-900">
            <strong>Aujourd'hui, IA Débat s'utilise librement.</strong> Le paiement en ligne n'est pas encore ouvert :
            personne ne vous demandera de carte bancaire ici.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 p-4">
              <div className="text-2xl font-extrabold text-slate-900">15 € par an</div>
              <div className="text-base text-slate-600">IA Débat seule.</div>
            </div>
            <div className="rounded-xl border-2 border-emerald-600 p-4">
              <div className="text-2xl font-extrabold text-emerald-700">40 € par an</div>
              <div className="text-base text-slate-600">Toutes les applications Alphabette.</div>
            </div>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Tarifs prévus, TTC, avec 7 jours d'essai. Les fonctions d'intelligence artificielle utilisent votre propre
            clé : leur coût vous est facturé directement par le fournisseur d'IA que vous choisissez.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <a
              href="https://alphabette.fr"
              className="px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-sm text-slate-800 hover:bg-slate-50"
            >
              Voir toutes les applications
            </a>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
  );
}
