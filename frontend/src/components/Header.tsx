import { Link } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useBalance } from 'wagmi';
import { useEffect } from 'react';

function Header() {
  const { address, isConnected, chain } = useAccount();
  
  // Get mUSD balance (you'll need to add the token address once you have it)
  // const { data: musdBalance } = useBalance({
  //   address: address,
  //   token: '0xYOUR_MUSD_CONTRACT_ADDRESS', // TODO: Add mUSD contract
  // });

  // Store wallet address in localStorage when connected
  useEffect(() => {
    if (isConnected && address) {
      localStorage.setItem('walletAddress', address);
    } else {
      localStorage.removeItem('walletAddress');
    }
  }, [isConnected, address]);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2">
              <div className="text-2xl font-bold bg-gradient-to-r from-bitcoin to-mezo bg-clip-text text-transparent">
                ⚡ EduFund
              </div>
            </Link>
            <nav className="hidden md:flex space-x-6">
              <Link to="/" className="text-gray-600 hover:text-gray-900 transition">
                Quests
              </Link>
              {isConnected && (
                <>
                  <Link to="/profile" className="text-gray-600 hover:text-gray-900 transition">
                    Profile
                  </Link>
                  <Link to="/rewards" className="text-gray-600 hover:text-gray-900 transition">
                    Rewards
                  </Link>
                </>
              )}
              <Link to="/company/login" className="text-mezo hover:text-purple-700 transition font-semibold">
                For Companies
              </Link>
            </nav>          </div>
          <div className="flex items-center space-x-4">
            {/* Show current network if on Mezo */}
            {isConnected && chain?.name === 'Mezo Testnet' && (
              <div className="hidden md:flex items-center bg-gradient-to-r from-bitcoin to-mezo text-white px-4 py-2 rounded-lg">
                <span className="font-bold text-sm">🔗 {chain.name}</span>
              </div>
            )}
            
            {/* Single Connect Wallet Button - includes network switching */}
            <ConnectButton 
              chainStatus="icon"
              showBalance={false}
            />
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;


