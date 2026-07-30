-- AlterTable: Threshold now holds only the two SAW criteria (thiMax, amoniaMax)
ALTER TABLE `Threshold`
    DROP COLUMN `suhuMin`,
    DROP COLUMN `suhuMax`,
    DROP COLUMN `rhMin`,
    DROP COLUMN `rhMax`,
    ADD COLUMN `thiMax` DOUBLE NOT NULL DEFAULT 90;
