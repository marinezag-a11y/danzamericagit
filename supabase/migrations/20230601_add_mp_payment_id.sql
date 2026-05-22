-- Migration: add mp_payment_id column to raffle_orders and help_orders

alter table raffle_orders
  add column mp_payment_id varchar(255);

alter table help_orders
  add column mp_payment_id varchar(255);
