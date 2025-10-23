
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Initialize the Firebase Admin SDK, which gives our functions
// full access to our database.
admin.initializeApp();
const db = admin.firestore();

/**
 * This is a "Callable Function" that allows an artist to claim a job.
 * It uses a transaction to ensure that only one artist can claim a job.
 */
export const claimJob = functions.https.onCall(async (data, context) => {
  // 1. Authentication Check: Ensure the user is a logged-in artist
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "You must be logged in to claim a job.",
    );
  }
  const artistId = context.auth.uid;
  const bookingId = data.bookingId;

  if (!bookingId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "The function must be called with a 'bookingId'.",
    );
  }

  const bookingRef = db.collection("bookings").doc(bookingId);

  // 2. Firestore Transaction: Atomically claim the job
  try {
    await db.runTransaction(async (transaction) => {
      const bookingDoc = await transaction.get(bookingRef);

      if (!bookingDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Booking not found.");
      }

      const bookingData = bookingDoc.data();

      // 3. Check if the job is still available
      // The status "Needs Assignment" is what we're looking for
      if (bookingData?.status !== "Needs Assignment") {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "This job has already been claimed or is no longer available.",
        );
      }

      // 4. Update the booking to assign the artist
      transaction.update(bookingRef, {
        status: "Confirmed", // The job is now confirmed for this artist
        artistIds: [artistId],
      });
    });

    // 5. Return a success message
    return { success: true, message: "Job successfully claimed!" };

  } catch (error) {
    console.error("Transaction failed: ", error);
    if (error instanceof functions.https.HttpsError) {
      throw error; // Re-throw errors we created
    }
    // Throw a generic error for any other issues
    throw new functions.https.HttpsError(
      "internal",
      "An error occurred while trying to claim the job.",
    );
  }
});


/**
 * This is a "Callable Function" for handling customer cancellations.
 * It contains the 72-hour refund logic.
 */
const CANCELLATION_WINDOW_HOURS = 72;
// NOTE: In a real app, you would install a payment SDK like Stripe or Razorpay.
// e.g., const stripe = require("stripe")("YOUR_STRIPE_SECRET_KEY");

export const requestCancellation = functions.https.onCall(async (data, context) => {
  // 1. Authentication Check
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "You must be logged in.");
  }
  const customerId = context.auth.uid;
  const { bookingId } = data;

  if (!bookingId) {
    throw new functions.https.HttpsError("invalid-argument", "Booking ID is required.");
  }

  const bookingRef = db.collection("bookings").doc(bookingId);
  const bookingDoc = await bookingRef.get();

  if (!bookingDoc.exists) {
    throw new functions.https.HttpsError("not-found", "Booking not found.");
  }

  const booking = bookingDoc.data();

  // 2. Verify the user owns this booking
  if (booking?.customerId !== customerId) {
    throw new functions.https.HttpsError("permission-denied", "This is not your booking.");
  }

  const eventDate = (booking?.eventDate as admin.firestore.Timestamp).toDate();
  const now = new Date();
  const hoursUntilEvent = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  // 3. Check if cancellation is within the refund window
  if (hoursUntilEvent > CANCELLATION_WINDOW_HOURS) {
    // --- REFUND LOGIC ---
    // This is where you would integrate your payment gateway to issue a refund.
    // For example: await stripe.refunds.create({ charge: booking.paymentChargeId });
    // After the refund is successful, update the booking status.
    await bookingRef.update({ status: "Cancelled", cancellationReason: "Customer cancelled within refund window." });
    return { success: true, message: "Booking cancelled. A refund for your advance will be processed." };
  } else {
    // --- NO REFUND ---
    await bookingRef.update({ status: "Cancelled", cancellationReason: "Customer cancelled outside refund window." });
    return { success: true, message: "Booking cancelled. The advance payment is non-refundable as it is within 72 hours of the event." };
  }
});
