import mongoose from 'mongoose';

const CommunityChatSchema = new mongoose.Schema({
  sender: {
    type: String,
    // ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const CommunityChat = mongoose.model('CommunityChat', CommunityChatSchema);
export default CommunityChat;
