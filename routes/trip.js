import express from "express";
import { 
  createTrip,
  getTrip,
  getUserTrips,
  searchTrips,
  getSingleTrip,
  updateTrip,
  deleteTrip
} from "../controllers/trip.js";
import auth from "../middleware/auth.js";

const tripRouter = express.Router();

tripRouter.post("/", auth, createTrip);
tripRouter.get("/", getTrip);
tripRouter.get("/user-trips", auth, getUserTrips);
tripRouter.get("/search/list", searchTrips);
tripRouter.get("/:id", getSingleTrip);
tripRouter.patch("/:id", auth, updateTrip);
tripRouter.delete("/:id", auth, deleteTrip);

export default tripRouter;
