-- Add column to enable/disable order type (dine/takeaway) visibility in cart
ALTER TABLE "Settings" ADD COLUMN "orderTypeVisibilityEnabled" BOOLEAN NOT NULL DEFAULT TRUE;
