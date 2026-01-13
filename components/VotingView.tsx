import React, { useState } from 'react';
import { Vote, Plus, CheckCircle2, User as UserIcon, Trash2 } from 'lucide-react';
import { Poll, User, VoteOption } from '../types';

interface VotingViewProps {
  polls: Poll[];
  currentUser: User;
  users: User[]; // Need full user list to lookup names
  onVote: (pollId: string, optionId: string, userId: string) => void;
  onCreatePoll: (poll: Poll) => void;
  onDeletePoll: (pollId: string) => void;
}

const VotingView: React.FC<VotingViewProps> = ({ polls, currentUser, users, onVote, onCreatePoll, onDeletePoll }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPollQuestion, setNewPollQuestion] = useState('');
  const [newPollOptions, setNewPollOptions] = useState(['', '']);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validOptions = newPollOptions.filter(o => o.trim() !== '');
    if (!newPollQuestion || validOptions.length < 2) return;

    const newPoll: Poll = {
      id: Date.now().toString(),
      creatorId: currentUser.id,
      creatorName: currentUser.name,
      question: newPollQuestion,
      isActive: true,
      createdAt: new Date(),
      options: validOptions.map((text, index) => ({
        id: `opt-${Date.now()}-${index}`,
        text,
        votes: 0,
        voterIds: []
      }))
    };

    onCreatePoll(newPoll);
    setShowCreateModal(false);
    setNewPollQuestion('');
    setNewPollOptions(['', '']);
  };

  const handleOptionChange = (index: number, value: string) => {
    const updated = [...newPollOptions];
    updated[index] = value;
    setNewPollOptions(updated);
  };

  const addOptionField = () => setNewPollOptions([...newPollOptions, '']);

  // Calculate percentages
  const getPercentage = (optionVotes: number, totalVotes: number) => {
    if (totalVotes === 0) return 0;
    return Math.round((optionVotes / totalVotes) * 100);
  };

  // Helper to get names from IDs
  const getVoterNames = (voterIds: string[]) => {
      return voterIds.map(id => {
          const u = users.find(user => user.id === id);
          return u ? u.name : 'Unknown';
      });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-brand-dark">التصويت والاقتراحات</h2>
          <p className="text-gray-500 mt-1">شارك برأيك للفطور القادم</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-brand-dark text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-brand-light hover:text-brand-dark transition-all shadow-lg"
        >
          <Plus size={20} />
          <span>اقتراح جديد</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {polls.map(poll => {
          const totalVotes = poll.options.reduce((acc, opt) => acc + opt.votes, 0);
          const userVotedOptionId = poll.options.find(o => o.voterIds.includes(currentUser.id))?.id;
          
          const canDelete = true;

          return (
            <div key={poll.id} className="bg-white rounded-2xl p-6 shadow-sm border border-brand-light/10 relative overflow-hidden group">
               <div className="flex items-center justify-between mb-4">
                   <div className="flex items-center gap-2">
                        <span className="bg-brand-offwhite p-1 rounded-full"><UserIcon size={14} className="text-brand-dark"/></span>
                        <span className="text-xs text-gray-500">تم الإنشاء بواسطة: {poll.creatorName}</span>
                   </div>
                   {canDelete && (
                       <button 
                         onClick={() => onDeletePoll(poll.id)}
                         className="text-gray-300 hover:text-red-500 transition-colors p-1"
                         title="حذف التصويت"
                       >
                           <Trash2 size={16} />
                       </button>
                   )}
               </div>
              <h3 className="text-xl font-bold text-brand-dark mb-6">{poll.question}</h3>
              
              <div className="space-y-4">
                {poll.options.map(option => {
                  const percent = getPercentage(option.votes, totalVotes);
                  const isSelected = userVotedOptionId === option.id;
                  const voterNames = getVoterNames(option.voterIds);

                  return (
                    <div key={option.id} className="group/option">
                        <button
                        onClick={() => onVote(poll.id, option.id, currentUser.id)}
                        className={`w-full relative h-12 rounded-xl overflow-hidden border transition-all ${isSelected ? 'border-brand-dark ring-1 ring-brand-dark' : 'border-gray-200 hover:border-brand-light'}`}
                        >
                            {/* Progress Bar Background */}
                            <div 
                                className="absolute top-0 right-0 h-full bg-brand-offwhite transition-all duration-500 ease-out"
                                style={{ width: `${percent}%` }}
                            />
                            
                            <div className="absolute inset-0 flex justify-between items-center px-4 z-10">
                                <div className="flex items-center gap-2">
                                {isSelected && <CheckCircle2 size={16} className="text-brand-dark" />}
                                <span className={`font-medium ${isSelected ? 'text-brand-dark' : 'text-gray-700'}`}>{option.text}</span>
                                </div>
                                <span className="text-sm font-bold text-brand-dark">{percent}% ({option.votes})</span>
                            </div>
                        </button>
                        
                        {/* Voter Names Display */}
                        {voterNames.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2 px-2">
                                {voterNames.map((name, idx) => (
                                    <span key={idx} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md border border-gray-200">
                                        {name}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 text-xs text-gray-400 text-left pt-2 border-t border-dashed">
                 إجمالي الأصوات: {totalVotes}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Poll Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-brand-dark p-6 text-white flex justify-between items-center">
              <h3 className="text-xl font-bold">إنشاء تصويت جديد</h3>
              <button onClick={() => setShowCreateModal(false)} className="hover:text-red-300"><Plus size={24} className="rotate-45" /></button>
            </div>
            
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">عنوان التصويت / السؤال</label>
                <input 
                  type="text" 
                  value={newPollQuestion}
                  onChange={e => setNewPollQuestion(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-dark outline-none"
                  placeholder="مثال: من أي مطعم نطلب اليوم؟"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">الخيارات</label>
                <div className="space-y-2">
                  {newPollOptions.map((opt, idx) => (
                    <input 
                      key={idx}
                      type="text"
                      value={opt}
                      onChange={e => handleOptionChange(idx, e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-1 focus:ring-brand-light outline-none"
                      placeholder={`خيار رقم ${idx + 1}`}
                      required={idx < 2}
                    />
                  ))}
                </div>
                <button type="button" onClick={addOptionField} className="mt-2 text-sm text-brand-dark font-bold hover:underline">+ إضافة خيار آخر</button>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-6 py-2 rounded-xl text-gray-500 hover:bg-gray-100">إلغاء</button>
                <button type="submit" className="px-6 py-2 rounded-xl bg-brand-dark text-white hover:bg-brand-light hover:text-brand-dark transition-colors font-bold">نشر التصويت</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VotingView;