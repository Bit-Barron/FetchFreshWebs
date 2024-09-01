"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProductCard from "@/components/elements/product/productcard";
import Sidebar from "@/components/elements/sidebar/sidebar";
import { StoreHook } from "@/components/hooks/store-hook";
import { useProductStore } from "../../../../../store/ProductStore";
import { CartStore } from "../../../../../store/CartStore";
import { Attributes, Product } from "@/types/product";
import { MobileSidebar } from "@/components/elements/sidebar/mobile-sidebar";
import { useFilterSortStore } from "@/store/FilterStore";
import { ComboboxSelects } from "@/components/elements/combobox-selects";

interface StorePageProps {
  params: { name: string };
}

export default function StorePage({ params }: StorePageProps) {
  const {
    selectedCategory,
    sorting,
    filterAttribute,
    setSorting,
    setFilterAttribute,
    setSelectedCategory,
  } = useFilterSortStore();
  const { products, setProducts } = useProductStore();
  const { addToCart, isInCart, removeItemFromCart } = CartStore();
  const { productMutation, categoryQuery } = StoreHook();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [maxPage, setMaxPage] = useState<number | null>(null);
  const [productsPerPage, setProductsPerPage] = useState("20");
  const [attributeFilter, setAttributeFilter] = useState<
    keyof Attributes | null
  >(null);

  useEffect(() => {
    if (params.name !== "rewe") {
      router.push("/");
    } else {
      fetchProducts(page);
    }
  }, [
    params.name,
    selectedCategory,
    sorting,
    filterAttribute,
    attributeFilter,
    productsPerPage,
    page,
  ]);

  const fetchProducts = async (nextPage: number = 1) => {
    try {
      const response = await productMutation.mutateAsync({
        category: selectedCategory,
        page: nextPage,
        sorting,
        filterAttribute,
        attributes: attributeFilter,
        objects_per_page: productsPerPage,
      } as any);

      setProducts(response.data.products.products);

      setMaxPage(response.data.totalPages || null);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const getFilteredProducts = () => {
    return products.filter((product: Product) => {
      if (filterAttribute && !product.attributes[filterAttribute]) {
        return false;
      }
      if (attributeFilter && !product.attributes[attributeFilter]) {
        return false;
      }
      return true;
    });
  };

  const handleNextPage = () => {
    if (maxPage === null || page >= maxPage) return;
    setPage((prevPage) => {
      const nextPage = prevPage + 1;
      fetchProducts(nextPage);
      return nextPage;
    });
  };

  const handlePreviousPage = () => {
    if (page <= 1) return;
    setPage((prevPage) => {
      const prevPageNum = prevPage - 1;
      fetchProducts(prevPageNum);
      return prevPageNum;
    });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1">
        <Sidebar
          categories={categoryQuery.data?.topLevelCategories || []}
          onCategoryClick={setSelectedCategory}
        />
        <MobileSidebar
          categories={categoryQuery.data?.topLevelCategories || []}
          onCategoryClick={setSelectedCategory}
        />
        <main className="flex-1 space-y-8 bg-[#F6F7F8] p-4 md:p-6">
          <section>
            <div className="md:flex md:justify-between">
              <h2 className="mb-5 text-2xl font-bold">
                {selectedCategory || "Meistverkaufte Artikel"}
              </h2>

              <ComboboxSelects
                sorting={sorting}
                filterAttribute={filterAttribute as unknown as string}
                productsPerPage={productsPerPage}
                setSorting={setSorting}
                setFilterAttribute={setFilterAttribute}
                setProductsPerPage={setProductsPerPage}
                products={products}
                attributeFilter={attributeFilter as unknown as string}
                setAttributeFilter={setAttributeFilter}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4 lg:grid-cols-6">
              {getFilteredProducts().map((product: Product) => (
                <ProductCard
                  key={product.articleId}
                  product={product}
                  isInCart={isInCart(product.articleId as unknown as number)}
                  addToCart={addToCart}
                  removeFromCart={removeItemFromCart}
                />
              ))}
            </div>
          </section>
        </main>
      </div>
      <div className="self-center mb-4 flex gap-4">
        <button
          onClick={handlePreviousPage}
          className="px-4 py-2 bg-gray-500 text-white rounded disabled:opacity-50"
          disabled={page <= 1}
        >
          Previous Page
        </button>
        <button
          onClick={handleNextPage}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          disabled={maxPage === null || page >= maxPage}
        >
          Load More
        </button>
      </div>
    </div>
  );
}
