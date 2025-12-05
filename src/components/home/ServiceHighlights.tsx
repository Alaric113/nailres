import React from 'react';
import { Link } from 'react-router-dom';

interface Category {
  title: string;
  price: number;
  description: string;
  highlights: string[];
  link: string;
  imglink: string;
}

interface ServiceHighlightsProps {
  categories: Category[];
}

const ServiceHighlights: React.FC<ServiceHighlightsProps> = ({ categories }) => {
  return (
    <section id="services" className="min-h-screen flex items-center py-20 bg-secondary-light snap-start snap-always relative overflow-hidden">
       {/* Decorative background elements */}
       <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
       <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-4xl sm:text-5xl font-serif font-medium mb-4 text-text-main">
            Our Services
          </h2>
          <div className="w-16 h-0.5 bg-primary mx-auto opacity-60"></div>
          <p className="mt-4 text-text-light tracking-wide text-sm sm:text-base">
            專屬您的美學設計，展現自然自信光采
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 lg:gap-12 max-w-6xl mx-auto">
          {categories.map((category) => (
            <Link
              to={category.link}
              key={category.title}
              className="group relative block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2"
            >
              {/* Image Container */}
              <div className="aspect-[4/5] w-full overflow-hidden relative">
                <img
                  src={category.imglink || '/default-service.jpg'}
                  alt={category.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 filter saturate-[0.9] group-hover:saturate-100"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-500"></div>
                
                {/* Price Tag */}
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-sm font-serif text-text-main font-medium shadow-sm opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 delay-100">
                  NT$ {category.price} 起
                </div>
              </div>

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white pt-12">
                 <h3 className="text-2xl font-serif mb-1 tracking-wide group-hover:text-secondary transition-colors">
                  {category.title}
                </h3>
                <p className="text-xs font-light tracking-[0.2em] uppercase text-secondary/80 mb-3">
                  {category.description}
                </p>
                <div className="h-0 group-hover:h-auto overflow-hidden transition-all duration-300 opacity-0 group-hover:opacity-100">
                  <div className="flex flex-wrap gap-2 mt-2">
                    {category.highlights.map((tag) => (
                      <span key={tag} className="text-xs bg-white/20 backdrop-blur-sm px-2 py-1 rounded-md text-white/90">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServiceHighlights;