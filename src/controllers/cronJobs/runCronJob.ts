import { Response } from "express";
import { sendSMS } from "../../lib/sendSMS";
import NotificationModel from "../../models/Notification.model";
import ProductModel from "../../models/Product.model";
import TransactionModel from "../../models/Transaction.Model";
import UserModel from "../../models/User.model";
import { AuthRequest } from "../../types/AuthRequest";

export async function runCronJob(req: AuthRequest, res: Response) {

  const users = await UserModel.find({});
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const user of users) {
    // 1. Low Stock Notifications
    const products = await ProductModel.find({
      user: user._id,
      $expr: { $lte: ["$currentStock", "$lowStockThreshold"] },
    });

    for (const p of products) {
      await NotificationModel.create({
        user: user._id,
        title: `${p.name} is low in stock`,
        message: `Only ${p.currentStock} ${p.unit} left of ${p.name}`,
        type: "stock_alert",
        isRead: false,
      });
    }

    // 2. Vendor Payment Due (Purchase Credit)
    const purchases = await TransactionModel.find({
      userId: user._id,
      type: "purchase",
      paymentType: "credit",
      paid: false,
      dueDate: {
        $gte: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
        $lte: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000),
      },
    });

    for (const txn of purchases) {
      if (txn?.dueDate) {
        const due = new Date(txn.dueDate);
        due.setHours(0, 0, 0, 0);

      const daysDiff = Math.round(
          (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
      if ([-2, 0, 2].includes(daysDiff)) {
      await NotificationModel.create({
        user: user._id,
        title: "Payment due to vendor",
        message: `Payment of ₹${txn.totalAmount} is due to ${txn.supplier?.name} for purchase on ${txn.transactionDate.toLocaleDateString()}. is ${
            daysDiff === 2
              ? `due in 2 days.`
              : daysDiff === 0
              ? `due today.`
              : `overdue by 2 days.`
          } Please pay at your earliest.`,
        type: "reminder",
        isRead: false,
      });
    }}

    // 3. Customer Repayment Due (Sales Credit)
    const sales = await TransactionModel.find({
      userId: user._id,
      type: "sale",
      paymentType: "credit",
      paid: false,
      dueDate: {
        $gte: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
        $lte: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000),
      },
    });

    for (const txn of sales) {
      if (txn?.dueDate) {
        const due = new Date(txn.dueDate);
        due.setHours(0, 0, 0, 0);
        const daysDiff = Math.round(
          (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        if ([-2, 0, 2].includes(daysDiff)) {
          const message = `
Hi ${txn.customer?.name}, your payment of ₹${txn.totalAmount} on purchase on ${txn.transactionDate.toLocaleDateString()} from ${user.shopName} is ${
            daysDiff === 2
              ? `due in 2 days.`
              : daysDiff === 0
              ? `due today.`
              : `overdue by 2 days.`
          } Please pay at your earliest convenience.`;

          const phone = txn.customer?.phone;
          if (phone) {
            const res = await sendSMS(phone, message);
            if (res) {
              await NotificationModel.create({
                user: user._id,
                title: "Payment alert sent to customer",
                message: `Repayment reminder of ₹${txn.totalAmount} is sent to ${txn.customer?.name} for purchase on ${txn.transactionDate.toLocaleDateString()}.`,
                type: "reminder",
                isRead: false,
              });
            }
          }
        }
      }
    }
  }

  console.log("✅ Cron job completed at", new Date().toISOString());

  return res.status(200).json(
    {
      success: true,
      message: "Notifications generated for all users",
    }
  );
}}
