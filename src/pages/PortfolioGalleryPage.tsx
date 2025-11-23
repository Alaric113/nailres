import{ useState } from 'react';
import usePortfolioItems from '../hooks/usePortfolioItems';
import LoadingSpinner from '../components/common/LoadingSpinner';


const PortfolioGalleryPage = () => {
  const { portfolioItems, loading, error } = usePortfolioItems();
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = ['all', '美甲', '美睫', '霧眉', '其他']; // Must match categories in PortfolioForm

  const filteredItems = portfolioItems.filter(item => 
    item.isActive && (selectedCategory === 'all' || item.category === selectedCategory)
  );

  if (loading) {
    return <LoadingSpinner fullScreen text="載入作品集..." />;
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">載入作品集失敗: {error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16 md:pt-24 lg:pt-32"> {/* Adjust padding top for fixed header */}
      <header className="py-8 bg-white shadow-sm">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">作品集</h1>
          <p className="text-gray-600">探索我們的精選作品</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 
                ${selectedCategory === cat 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`
              }
            >
              {cat === 'all' ? '所有作品' : cat}
            </button>
          ))}
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-center text-gray-500 p-8">
            目前沒有符合條件的作品。
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredItems.map(item => (
              <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                {item.imageUrls && item.imageUrls.length > 0 && (
                  <img 
                    src={item.imageUrls[0]} 
                    alt={item.title} 
                    className="w-full h-56 object-cover" 
                    loading="lazy"
                  />
                )}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-800 truncate">{item.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{item.category}</p>
                  <p className="text-sm text-gray-700 line-clamp-2">{item.description}</p>
                  {/* Potentially add a "View Details" link later */}
                  {/* <Link to={`/portfolio/${item.id}`} className="mt-3 inline-block text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                    查看詳情 &rarr;
                  </Link> */}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default PortfolioGalleryPage;
