const Event = require('../../models/event');
const User = require('../../models/user');
const Booking = require('../../models/booking')
const bcrypt = require("bcryptjs");

const events = async (eventIds) => {
  try {
    const events = await Event.find({_id : {$in: eventIds}});
    const mappedEvents = events.map(event => {return {
      ...event._doc, 
      _id: event.id,
      creator: singleUser(event.creator)
    }})
    return mappedEvents;
    
  } catch (err) {
    throw err
  }
}

const singleEvent = async (eventId) => {
  try {
    const event = await Event.findById(eventId);
    return { ...event._doc, _id: event.id, creator: singleUser(event._doc.creator) };
    
  } catch (err) {
    throw err
  }
}

const singleUser = async (userId) => {
  try {
    const user = await User.findById(userId);
    return { ...user._doc, _id: user.id, createdEvents: events(user._doc.createdEvents) };
    
  } catch (err) {


    throw err
  }
}

module.exports = {
  users: async () => {
    try {
      const users = await User.find();
      return users.map(selectedUser => singleUser(selectedUser._id));
    } catch (err) {
      throw err;
    }
  },
  events: async () => {
    try {
      const events = await Event.find();
      return events.map(event => {
        return { 
          ...event._doc, 
          _id: event.id,
          date: new Date(event._doc.date).toISOString(),
          creator: singleUser(event._doc.creator)
        };
      });
    } catch (err) {
      throw err;
    }
  },
  bookings: async () => {
    try {
      const bookings = await Booking.find();
      return bookings.map(booking => {
        return { ...booking._doc, 
          _id: booking.id, 
          event: singleEvent(booking._doc.event),
          user: singleUser(booking._doc.user),
          createdAt: new Date(booking._doc.createdAt).toISOString(), 
          updatedAt: new Date(booking._doc.updatedAt).toISOString()
        };
      });
      
    } catch (err) {
      throw err;
    }
  },
  createEvent: async (args) => {
    try {
      const event = new Event({
        title: args.eventInput.title,
        description: args.eventInput.description,
        price: +args.eventInput.price,
        date: new Date(args.eventInput.date),
        creator: '62c943ddde3aed2074944e5e'
      });
      const creator = await User.findById('62c943ddde3aed2074944e5e');
      if (!creator) {
        throw new Error('User not found!');
      }
      creator.createdEvents.push(event);
      await creator.save();
      const result = await event.save();
      return {
        ...result._doc, 
        _id: result._doc._id, 
        creator: singleUser(result._doc.creator)
      }
    } catch (err) {
      throw err;
    }
  },
  createUser: async (args) => {
    try {
      const userEmail = args.userInput.email.toLowerCase();
      const existingUser = await User.findOne({ email: userEmail});
      if (existingUser) {
        throw new Error('User exist already!')
      };
      const hashedPassword = await bcrypt.hash(args.userInput.password, 12);
      const user = new User({
        email: userEmail,
        password: hashedPassword
      });
      user.save().then(result => {
        console.log(result);
        return { ...result._doc, password: null, _id: result.id };
      });
      return user;
    } catch (err) {
      throw err;
    }
  },
  bookEvent: async (args) => {
    try {
      const fetchedEvent = await Event.findOne({ _id: args.eventId});
      const booking = new Booking({
        user: '62c943ddde3aed2074944e5e',
        event: fetchedEvent
      });
      const result = await booking.save();
      return { 
        ...result._doc, 
        _id: result.id,
        user: singleUser(result._doc.user),
        event: singleEvent(result._doc.event),
        createdAt: new Date(result._doc.createdAt).toISOString(), 
        updatedAt: new Date(result._doc.updatedAt).toISOString()
      };
    } catch (err) {
      throw err;
    }
  },
  cancelBooking: async (args) => {
    try {
      const booking = await Booking.findById(args.bookingId).populate('event');
      const event = { 
        ...booking.event._doc, 
        _id: booking.event._id,
        creator: singleUser(booking.event._doc.creator)
      };
      await Booking. deleteOne({ _id: args.bookingId })
      return event;

    } catch (err) {
      throw err;
    }
  }
}