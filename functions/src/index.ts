

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


/**
 * Creates a new booking document and sends notifications.
 */
export const createBooking = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "You must be logged in to create a booking.");
    }

    const { bookingData } = data;

    if (!bookingData) {
        throw new functions.https.HttpsError("invalid-argument", "Booking data is required.");
    }
    
    // Ensure customerId in bookingData matches the authenticated user.
    if (bookingData.customerId !== context.auth.uid) {
         throw new functions.https.HttpsError("permission-denied", "You can only create bookings for yourself.");
    }
    
    const { items, paymentMethod, appliedReferralCode, ...restOfBookingData } = bookingData;

    // Determine initial booking status and artist assignment
    let finalArtistIds: string[] = [];
    let bookingStatus: 'Pending Approval' | 'Needs Assignment' | 'Pending Confirmation' = 'Needs Assignment';
    let completionCode: string | undefined = undefined;
    
    if (paymentMethod === 'online') {
        bookingStatus = 'Pending Approval';
        completionCode = Math.floor(100000 + Math.random() * 900000).toString();
    } else {
        bookingStatus = 'Pending Confirmation';
    }

    if (appliedReferralCode) {
        const artistsCollection = db.collection("artists");
        const artistQuery = await artistsCollection.where('referralCode', '==', appliedReferralCode).limit(1).get();
        if (!artistQuery.empty) {
            const matchedArtist = artistQuery.docs[0];
            finalArtistIds = [matchedArtist.id];
            if (bookingStatus !== 'Pending Confirmation') {
                bookingStatus = 'Pending Approval';
            }
        }
    } else {
        const preSelectedArtistIds = Array.from(new Set(items.map((item: any) => item.artist?.id).filter(Boolean)));
         if (preSelectedArtistIds.length > 0) {
            finalArtistIds = preSelectedArtistIds as string[];
             if (bookingStatus !== 'Pending Confirmation') {
                bookingStatus = 'Pending Approval';
            }
        }
    }

    // Get Admin IDs for notifications
    const adminSnapshot = await db.collection('teamMembers').where('role', '==', 'Super Admin').get();
    const adminIds = adminSnapshot.docs.map(doc => doc.id);


    const finalBookingData = {
        ...restOfBookingData,
        items,
        status: bookingStatus,
        artistIds: finalArtistIds,
        completionCode: completionCode,
        adminIds: adminIds,
        paidOut: false,
    };
    
    // Create the booking document
    const bookingsCollection = db.collection("bookings");
    const docRef = await bookingsCollection.add(finalBookingData);
    await docRef.update({ id: docRef.id }); // Add the document ID to the booking itself
    
    // --- Notification Logic ---
    const { customerName, district, state, eventType } = finalBookingData;
    const eventDate = (finalBookingData.eventDate as admin.firestore.Timestamp).toDate();

    const createNotification = async (notificationData: any) => {
        await db.collection("notifications").add(notificationData);
    };

    // 1. Notify assigned artists
    if (finalArtistIds && finalArtistIds.length > 0) {
        for (const artistId of finalArtistIds) {
            await createNotification({
                artistId,
                bookingId: docRef.id,
                title: "You have a new booking!",
                message: `You've been assigned to a booking for ${eventType} on ${eventDate.toLocaleDateString()}.`,
                timestamp: new Date().toISOString(),
                isRead: false,
                type: 'booking',
            });
        }
    } else { // 2. Notify all relevant artists if it's an express booking
        const servicesNeeded = items.map((i: any) => i.servicePackage.service);
        const artistsQuery = await db.collection("artists")
            .where("services", "array-contains-any", servicesNeeded)
            .get();
        
        for (const artistDoc of artistsQuery.docs) {
             const artist = artistDoc.data();
             const servesArea = artist.serviceAreas.some((area: any) => area.district === district && area.state === state);
             if (servesArea) {
                 await createNotification({
                    artistId: artistDoc.id,
                    bookingId: docRef.id,
                    title: "New Job Available in Your Area!",
                    message: `An express booking for ${eventType} in ${district} is available. Claim it now!`,
                    timestamp: new Date().toISOString(),
                    isRead: false,
                    type: 'booking',
                });
             }
        }
    }

    // 3. Notify admins
    if (adminIds && adminIds.length > 0) {
        for (const adminId of adminIds) {
            await createNotification({
                artistId: adminId, // Using 'artistId' field to also target admins in notifications collection
                bookingId: docRef.id,
                title: `New Booking by ${customerName}`,
                message: `A new booking for ${eventType} on ${eventDate.toLocaleDateString()} has been created.`,
                timestamp: new Date().toISOString(),
                isRead: false,
                type: 'booking',
            });
        }
    }

    return { success: true, bookingId: docRef.id };
});
