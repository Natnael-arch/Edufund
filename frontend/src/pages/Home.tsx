import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { questApi, Quest } from '../services/api';

function Home() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadQuests();
  }, []);

  const loadQuests = async () => {
    try {
      setLoading(true);
      const data = await questApi.getQuests();
      setQuests(data);
      setError(null);
    } catch (err) {
      setError('Failed to load quests');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bitcoin"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Learn & Earn with Bitcoin
        </h1>
        <p className="text-lg text-gray-600">
          Complete quests, gain knowledge, and earn mUSD rewards on Mezo
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {quests.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 text-lg">No quests available yet.</p>
          <p className="text-gray-400 mt-2">Check back soon for new learning opportunities!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quests.map((quest: any) => {
            const poolStatus = quest.poolStatus;
            const isAvailable = !poolStatus?.isFull && !poolStatus?.isOutOfFunds;
            
            return (
              <Link
                key={quest.id}
                to={`/quest/${quest.id}`}
                className={`bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-200 overflow-hidden ${
                  !isAvailable ? 'opacity-60' : ''
                }`}
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(
                        quest.difficulty
                      )}`}
                    >
                      {quest.difficulty}
                    </span>
                    <div className="flex items-center text-bitcoin font-bold">
                      <span className="text-lg">{quest.reward}</span>
                      <span className="text-sm ml-1">mUSD</span>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{quest.title}</h3>
                  <p className="text-gray-600 line-clamp-3">{quest.description}</p>
                  
                  {/* Pool Status */}
                  {poolStatus?.hasPool && (
                    <div className="mt-3 text-xs">
                      <div className="text-gray-500 mb-1">
                        Funded by: <span className="font-semibold">{poolStatus.companyName}</span>
                      </div>
                      {poolStatus.isFull || poolStatus.isOutOfFunds ? (
                        <div className="bg-red-100 text-red-800 px-2 py-1 rounded font-semibold">
                          ❌ Quest is Over
                        </div>
                      ) : (
                        <div className="text-green-700">
                          ✅ {poolStatus.remainingSlots} slot{poolStatus.remainingSlots !== 1 ? 's' : ''} left
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-100">
                  {isAvailable ? (
                    <button className="text-mezo font-semibold hover:underline">
                      Start Quest →
                    </button>
                  ) : (
                    <span className="text-gray-400 font-semibold">
                      Not Available
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Home;



