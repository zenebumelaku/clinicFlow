DROP TABLE "otps";
DROP TYPE "OtpPurpose";

UPDATE "payments"
SET "method" = 'OTHER'
WHERE "method" = 'TELEBIRR';

ALTER TYPE "PaymentMethod" RENAME VALUE 'TELEBIRR' TO 'CHAPA';
