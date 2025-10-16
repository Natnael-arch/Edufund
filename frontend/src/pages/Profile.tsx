import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { questApi, UserProfile } from '../services/api';

function Profile() {
  const { address, isConnected } = useAccount();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isConnected) {
      navigate('/');
      return;
    }
    if (address) {
      loadProfile();
    }
  }, [address, isConnected, navigate]);

  const loadProfile = async () => {
    if (!address) return;

    try {
      setLoading(true);
      const data = await questApi.getUserProfile(address);
      setProfile(data);
      setError(null);
    } catch (err) {
      setError('Failed to load profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bitcoin"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Failed to load profile</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Your Profile</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gradient-to-br from-bitcoin to-orange-400 rounded-lg p-6 text-white">
            <div className="text-sm opacity-90 mb-2">Total Rewards Earned</div>
            <div className="text-4xl font-bold">{profile.totalRewards} mUSD</div>
          </div>
          
          <div className="bg-gradient-to-br from-mezo to-purple-600 rounded-lg p-6 text-white">
            <div className="text-sm opacity-90 mb-2">Quests Completed</div>
            <div className="text-4xl font-bold">{profile.completedQuests.length}</div>
          </div>
        </div>

        <div className="mb-4">
          <div className="text-sm text-gray-600 mb-1">Wallet Address</div>
          <div className="font-mono text-sm bg-gray-100 p-3 rounded-lg break-all">
            {profile.walletAddress}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Completed Quests</h2>
        
        {profile.completedQuests.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">You haven't completed any quests yet</p>
            <button
              onClick={() => navigate('/')}
              className="text-mezo font-semibold hover:underline"
            >
              Browse Quests →
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {profile.completedQuests.map((cq) => (
              <div
                key={cq.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-mezo transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {cq.quest.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-2">{cq.quest.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="capitalize">{cq.quest.difficulty}</span>
                      <span>•</span>
                      <span>Completed {new Date(cq.completedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <div className="text-sm text-gray-600 mb-1">Earned</div>
                    <div className="text-2xl font-bold text-bitcoin">
                      {cq.quest.reward} mUSD
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;



