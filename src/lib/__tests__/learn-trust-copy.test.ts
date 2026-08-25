import { describe, expect, it } from "vitest";
import {
  COMPOUNDED_DISCLOSURE,
  COMPOUNDED_SEMA_REQUIRED,
  COMPOUNDED_TIRZ_REQUIRED,
  LEARN_CLINICIAN_RX_SENTENCE,
  LEARN_CTA_TRUST_BODY,
  LEARN_DISCLAIMER_BODY,
  LEARN_FIFTY_STATE_SENTENCE,
  LEARN_USA_ONLY_SENTENCE,
  buyGlp1OnlineFaq,
  getGlp1OnlineWithBeemaFaq,
} from "@/lib/learn-trust-copy";

describe("learn-trust-copy", () => {
  it("leads buy/get-online FAQs with Yes and never guarantees a prescription", () => {
    const buy = buyGlp1OnlineFaq();
    expect(buy.question).toBe("Can I buy GLP-1 online?");
    expect(buy.answer).toMatch(/^Yes\./);
    expect(buy.answer).toContain(LEARN_USA_ONLY_SENTENCE);
    expect(buy.answer).toContain(LEARN_FIFTY_STATE_SENTENCE);
    expect(buy.answer).toContain(COMPOUNDED_DISCLOSURE);
    expect(buy.answer).toContain(LEARN_CLINICIAN_RX_SENTENCE);

    const tirz = buyGlp1OnlineFaq({ molecule: "tirzepatide" });
    expect(tirz.question).toBe("Can I get tirzepatide online?");
    expect(tirz.answer).toMatch(/compounded tirzepatide/i);
    expect(tirz.answer).toContain(COMPOUNDED_TIRZ_REQUIRED);
  });

  it("keeps the hub FAQ on get, not buy", () => {
    const faq = getGlp1OnlineWithBeemaFaq();
    expect(faq.question).not.toMatch(/buy/i);
    expect(faq.answer).toMatch(/^Yes\./);
    expect(faq.answer).toContain(COMPOUNDED_SEMA_REQUIRED);
  });

  it("reuses the required compounded sentences in the CTA and disclaimer", () => {
    for (const copy of [LEARN_CTA_TRUST_BODY, LEARN_DISCLAIMER_BODY]) {
      expect(copy).toContain(LEARN_FIFTY_STATE_SENTENCE);
      expect(copy).toContain(LEARN_USA_ONLY_SENTENCE);
      expect(copy).toContain(LEARN_CLINICIAN_RX_SENTENCE);
      expect(copy).toContain(COMPOUNDED_SEMA_REQUIRED);
      expect(copy).toContain(COMPOUNDED_TIRZ_REQUIRED);
      expect(copy).toContain(COMPOUNDED_DISCLOSURE);
    }
  });
});
