-- AlterTable
ALTER TABLE "public"."TicketHistory" ADD COLUMN "ticket_name" TEXT,
ADD COLUMN "ticket_machine" TEXT,
ALTER COLUMN "ticket_id" DROP NOT NULL;

-- DropForeignKey
ALTER TABLE "public"."TicketHistory" DROP CONSTRAINT "TicketHistory_ticket_id_fkey";

-- AddForeignKey
ALTER TABLE "public"."TicketHistory" ADD CONSTRAINT "TicketHistory_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."Ticket"("id") ON DELETE SET NULL ON UPDATE CASCADE;
