import { Link } from 'react-router-dom';

const Pagination = ({ page, pages, keyword = '' }) => {
  if (pages <= 1) return null;

  return (
    <div className="flex justify-center mt-8">
      <nav className="inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
        {[...Array(pages).keys()].map((x) => (
          <Link
            key={x + 1}
            to={`/products?keyword=${keyword}&page=${x + 1}`}
            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
              x + 1 === page
                ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
            } ${x === 0 ? 'rounded-l-md' : ''} ${
              x === pages - 1 ? 'rounded-r-md' : ''
            }`}
          >
            {x + 1}
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default Pagination;
