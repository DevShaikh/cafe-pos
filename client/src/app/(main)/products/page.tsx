"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Image from "next/image";
import axios from "axios";
import {
  Check,
  CircleCheck,
  CircleOff,
  Image as ImageIcon,
  Loader2,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  useCategories,
  useCreateCategory,
  useCreateProduct,
  useDeleteCategory,
  useProducts,
  useRemoveProductImage,
  useUploadProductImage,
  useUpdateCategory,
  useUpdateProduct,
} from "@/lib/hooks/product.hooks";
import { formatPaisa } from "@/lib/utils";
import type { Product } from "@/lib/schemas/product.schema";

const productFormSchema = z.object({
  name: z.string().trim().min(1, "Enter a product name.").max(120),
  description: z.string().trim().max(2000, "Description is too long."),
  price: z
    .string()
    .max(11, "The price exceeds the supported maximum.")
    .regex(/^\d+(?:\.\d{1,2})?$/, "Enter a price with up to 2 decimal places."),
  category: z.string().min(1, "Choose a category."),
});

const EMPTY_PRODUCTS: Product[] = [];
const MAX_PRODUCT_IMAGE_SIZE = 5 * 1024 * 1024;
const PRODUCT_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

function priceToInput(pricePaisa: number) {
  return `${Math.floor(pricePaisa / 100)}.${String(pricePaisa % 100).padStart(2, "0")}`;
}

function priceToPaisa(value: string) {
  const [rupees, paisa = ""] = value.split(".");
  const amount =
    Number(rupees) * 100 + Number(paisa.padEnd(2, "0") || "0");
  return Number.isSafeInteger(amount) && amount <= 9_999_999_999
    ? amount
    : null;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<{ error?: { message?: string } }>(error)) {
    return error.response?.data?.error?.message ?? fallback;
  }
  return fallback;
}

const ProductsPage = () => {
  const productsQuery = useProducts({ includeUnavailable: true });
  const categoriesQuery = useCategories();
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  const uploadProductImageMutation = useUploadProductImage();
  const removeProductImageMutation = useRemoveProductImage();
  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();
  const deleteCategoryMutation = useDeleteCategory();
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [productImage, setProductImage] = useState<File | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [removeCurrentImage, setRemoveCurrentImage] = useState(false);
  const [imageInputKey, setImageInputKey] = useState(0);
  const [productSearch, setProductSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState<
    "all" | "available" | "unavailable"
  >("all");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null,
  );
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [productError, setProductError] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [notice, setNotice] = useState("");
  const productImagePreview = useMemo(
    () => (productImage ? URL.createObjectURL(productImage) : null),
    [productImage],
  );

  useEffect(
    () => () => {
      if (productImagePreview) URL.revokeObjectURL(productImagePreview);
    },
    [productImagePreview],
  );

  const products = productsQuery.data ?? EMPTY_PRODUCTS;
  const categories = categoriesQuery.data ?? [];
  const filteredProducts = useMemo(() => {
    const searchTerm = productSearch.trim().toLocaleLowerCase();
    return products.filter((product) =>
      (!searchTerm ||
        `${product.name} ${product.category}`
          .toLocaleLowerCase()
          .includes(searchTerm)) &&
        (categoryFilter === "all" || product.category === categoryFilter) &&
        (availabilityFilter === "all" ||
          product.isAvailable === (availabilityFilter === "available")),
    );
  }, [availabilityFilter, categoryFilter, productSearch, products]);
  const productCountsByCategory = useMemo(() => {
    const counts = new Map<string, number>();
    for (const product of products) {
      if (product.category) {
        counts.set(
          product.category,
          (counts.get(product.category) ?? 0) + 1,
        );
      }
    }
    return counts;
  }, [products]);

  const resetProductForm = () => {
    setEditingProductId(null);
    setProductName("");
    setDescription("");
    setPrice("");
    setCategory("");
    setProductImage(null);
    setCurrentImageUrl(null);
    setRemoveCurrentImage(false);
    setImageInputKey((current) => current + 1);
    setProductError("");
  };

  const editProduct = (product: Product) => {
    setEditingProductId(product.id);
    setProductName(product.name);
    setDescription(product.description ?? "");
    setPrice(priceToInput(product.pricePaisa));
    setCategory(product.category);
    setProductImage(null);
    setCurrentImageUrl(product.imageUrl);
    setRemoveCurrentImage(false);
    setImageInputKey((current) => current + 1);
    setProductError("");
    setNotice("");
    setProductDialogOpen(true);
  };

  const openNewProductDialog = () => {
    resetProductForm();
    setProductDialogOpen(true);
  };

  const saveProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProductError("");
    setNotice("");
    const parsed = productFormSchema.safeParse({
      name: productName,
      description,
      price,
      category,
    });
    if (!parsed.success) {
      setProductError(parsed.error.issues[0]?.message ?? "Check the product details.");
      return;
    }

    const pricePaisa = priceToPaisa(parsed.data.price);
    if (pricePaisa === null) {
      setProductError("The price exceeds the supported maximum.");
      return;
    }
    const input = {
      name: parsed.data.name,
      description: parsed.data.description || null,
      pricePaisa,
      category: parsed.data.category,
    };
    const savedCategory = parsed.data.category;

    let savedProduct: Product;
    try {
      if (editingProductId) {
        savedProduct = await updateProductMutation.mutateAsync({
          id: editingProductId,
          input,
        });
      } else {
        savedProduct = await createProductMutation.mutateAsync(input);
      }

      try {
        if (productImage) {
          savedProduct = await uploadProductImageMutation.mutateAsync({
            id: savedProduct.id,
            image: productImage,
          });
        } else if (removeCurrentImage) {
          savedProduct = await removeProductImageMutation.mutateAsync(
            savedProduct.id,
          );
        }
      } catch (error) {
        setEditingProductId(savedProduct.id);
        setCurrentImageUrl(savedProduct.imageUrl);
        setProductError(
          `Product details were saved, but the photo was not. ${getErrorMessage(
            error,
            "Try selecting the photo again.",
          )}`,
        );
        return;
      }

      setNotice(editingProductId ? "Product updated." : "Product added to the menu.");
      resetProductForm();
      setCategory(savedCategory);
      setProductDialogOpen(false);
    } catch (error) {
      setProductError(getErrorMessage(error, "Could not save this product."));
    }
  };

  const addCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCategoryError("");
    setNotice("");
    try {
      const created = await createCategoryMutation.mutateAsync(
        newCategoryName.trim(),
      );
      setNewCategoryName("");
      setCategory((current) => current || created.name);
      setNotice("Category created.");
    } catch (error) {
      setCategoryError(getErrorMessage(error, "Could not create this category."));
    }
  };

  const saveCategoryName = async (id: string) => {
    setCategoryError("");
    setNotice("");
    try {
      const previousName = categories.find((item) => item.id === id)?.name;
      const nextName = editingCategoryName.trim();
      await updateCategoryMutation.mutateAsync({
        id,
        name: nextName,
      });
      if (category === previousName) setCategory(nextName);
      if (categoryFilter === previousName) setCategoryFilter(nextName);
      setEditingCategoryId(null);
      setEditingCategoryName("");
      setNotice("Category renamed; assigned products were updated.");
    } catch (error) {
      setCategoryError(getErrorMessage(error, "Could not rename this category."));
    }
  };

  const removeCategory = async (id: string) => {
    setCategoryError("");
    setNotice("");
    try {
      await deleteCategoryMutation.mutateAsync(id);
      setConfirmDeleteId(null);
      setNotice("Category deleted.");
    } catch (error) {
      setCategoryError(getErrorMessage(error, "Could not delete this category."));
    }
  };

  const toggleAvailability = async (product: Product) => {
    setProductError("");
    setNotice("");
    try {
      await updateProductMutation.mutateAsync({
        id: product.id,
        input: { isAvailable: !product.isAvailable },
      });
      setNotice(
        product.isAvailable
          ? `${product.name} is now unavailable for checkout.`
          : `${product.name} is available for checkout.`,
      );
    } catch (error) {
      setProductError(
        getErrorMessage(error, "Could not update product availability."),
      );
    }
  };

  const isSavingProduct =
    createProductMutation.isPending ||
    updateProductMutation.isPending ||
    uploadProductImageMutation.isPending ||
    removeProductImageMutation.isPending;

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-primary">
            <Package className="size-4" aria-hidden="true" />
            <span className="text-xs font-semibold tracking-wide">
              MENU MANAGEMENT
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Products &amp; categories
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Manage the items and categories your cashier sees at checkout.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="h-7 px-3 text-xs">
              {products.length} menu {products.length === 1 ? "item" : "items"}
            </Badge>
            <Badge variant="secondary" className="h-7 px-3 text-xs">
              {products.filter((product) => product.isAvailable).length}{" "}
              available
            </Badge>
            <Badge variant="outline" className="h-7 px-3 text-xs">
              {categories.length}{" "}
              {categories.length === 1 ? "category" : "categories"}
            </Badge>
          </div>
          <Button type="button" onClick={openNewProductDialog}>
            <Plus />
            Add product
          </Button>
        </div>
      </header>

      {notice && (
        <p
          role="status"
          className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-foreground"
        >
          {notice}
        </p>
      )}
      {productError && !productDialogOpen && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {productError}
        </p>
      )}

      <Dialog
        open={productDialogOpen}
        onOpenChange={(open) => {
          setProductDialogOpen(open);
          if (!open) resetProductForm();
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingProductId ? "Edit product" : "Add a product"}
            </DialogTitle>
            <DialogDescription>
              Enter the menu details below. Prices use PKR and are stored
              precisely in paisa.
            </DialogDescription>
          </DialogHeader>

          {categoriesQuery.isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : categoriesQuery.isError ? (
            <div className="space-y-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4">
              <p role="alert" className="text-sm text-destructive">
                Categories could not be loaded. Check the API connection and
                database migration.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void categoriesQuery.refetch()}
              >
                Try again
              </Button>
            </div>
          ) : categories.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-4">
              <p className="text-sm font-medium">Create a category first</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Products need a category. Close this dialog, add one in the
                Categories panel, then come back here.
              </p>
            </div>
          ) : (
            <form
              id="product-form"
              className="grid gap-4 sm:grid-cols-2"
              onSubmit={saveProduct}
            >
              <Field className="gap-1.5">
                <FieldLabel htmlFor="product-name">Product name</FieldLabel>
                <Input
                  id="product-name"
                  autoComplete="off"
                  maxLength={120}
                  required
                  value={productName}
                  onChange={(event) => setProductName(event.target.value)}
                />
              </Field>
              <Field className="gap-1.5">
                <FieldLabel htmlFor="product-price">Price (PKR)</FieldLabel>
                <Input
                  id="product-price"
                  inputMode="decimal"
                  maxLength={11}
                  placeholder="e.g. 250.00"
                  required
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                />
              </Field>
              <Field className="gap-1.5 sm:col-span-2">
                <FieldLabel htmlFor="product-description">
                  Description{" "}
                  <span className="text-muted-foreground">(optional)</span>
                </FieldLabel>
                <Textarea
                  id="product-description"
                  rows={3}
                  maxLength={2000}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </Field>
              <Field className="gap-1.5 sm:col-span-2">
                <FieldLabel htmlFor="product-category">Category</FieldLabel>
                <Select
                  value={category || undefined}
                  onValueChange={setCategory}
                >
                  <SelectTrigger
                    id="product-category"
                    className="h-10 w-full"
                  >
                    <SelectValue placeholder="Choose a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((item) => (
                      <SelectItem key={item.id} value={item.name}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field className="gap-1.5 sm:col-span-2">
                <FieldLabel htmlFor="product-image">
                  Product photo{" "}
                  <span className="text-muted-foreground">(optional)</span>
                </FieldLabel>
                <div className="flex flex-wrap items-start gap-4">
                  <div className="relative flex aspect-video w-48 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/40">
                    {productImagePreview ||
                    (!removeCurrentImage && currentImageUrl) ? (
                      <Image
                        src={productImagePreview ?? currentImageUrl ?? ""}
                        alt={`Photo of ${productName || "product"}`}
                        fill
                        unoptimized
                        sizes="192px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <ImageIcon className="size-8" aria-hidden="true" />
                        <span className="text-xs">No photo selected</span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <Input
                      key={imageInputKey}
                      id="product-image"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      aria-describedby="product-image-hint"
                      onChange={(event) => {
                        const file = event.currentTarget.files?.[0];
                        if (!file) return;
                        if (
                          !PRODUCT_IMAGE_TYPES.includes(file.type) ||
                          file.size > MAX_PRODUCT_IMAGE_SIZE
                        ) {
                          setProductError(
                            file.size > MAX_PRODUCT_IMAGE_SIZE
                              ? "Product photos must be no larger than 5 MB."
                              : "Choose a JPG, PNG, or WebP image.",
                          );
                          event.currentTarget.value = "";
                          return;
                        }
                        setProductError("");
                        setProductImage(file);
                        setRemoveCurrentImage(false);
                      }}
                    />
                    <FieldDescription id="product-image-hint">
                      JPG, PNG, or WebP; maximum file size 5 MB. Images are
                      stored on this computer.
                    </FieldDescription>
                    {(productImage || currentImageUrl) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (productImage) {
                            setProductImage(null);
                            setImageInputKey((current) => current + 1);
                          } else {
                            setRemoveCurrentImage((current) => !current);
                          }
                        }}
                      >
                        {productImage
                          ? "Clear selected photo"
                          : removeCurrentImage
                            ? "Keep current photo"
                            : "Remove photo"}
                      </Button>
                    )}
                  </div>
                </div>
              </Field>
              {productError && (
                <p
                  role="alert"
                  className="text-sm text-destructive sm:col-span-2"
                >
                  {productError}
                </p>
              )}
            </form>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setProductDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="product-form"
              disabled={
                isSavingProduct ||
                categoriesQuery.isLoading ||
                categoriesQuery.isError ||
                categories.length === 0
              }
            >
              {isSavingProduct ? (
                <Loader2 className="animate-spin" />
              ) : editingProductId ? (
                <Check />
              ) : (
                <Plus />
              )}
              {editingProductId ? "Save changes" : "Add product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(19rem,0.34fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader className="gap-4 border-b border-border/70 pb-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <CardTitle>Menu products</CardTitle>
                  <CardDescription>
                    Unavailable items stay in history and are hidden from
                    checkout.
                  </CardDescription>
                </div>
                <span className="text-xs tabular-nums text-muted-foreground">
                  Showing {filteredProducts.length} of {products.length}
                </span>
              </div>
              <div className="grid gap-2 sm:grid-cols-[minmax(12rem,1fr)_minmax(9rem,0.5fr)_minmax(9rem,0.5fr)]">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    type="search"
                    aria-label="Search products"
                    placeholder="Search by name..."
                    value={productSearch}
                    onChange={(event) => setProductSearch(event.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger
                    aria-label="Filter by category"
                    className="w-full"
                  >
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {categories.map((item) => (
                      <SelectItem key={item.id} value={item.name}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={availabilityFilter}
                  onValueChange={(value) => {
                    if (
                      value === "all" ||
                      value === "available" ||
                      value === "unavailable"
                    ) {
                      setAvailabilityFilter(value);
                    }
                  }}
                >
                  <SelectTrigger
                    aria-label="Filter by availability"
                    className="w-full"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All availability</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="unavailable">Unavailable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {productsQuery.isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="size-6 animate-spin text-primary" />
                </div>
              ) : productsQuery.isError ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4">
                  <p role="alert" className="text-sm text-destructive">
                    Could not load products. Check the local API connection.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void productsQuery.refetch()}
                  >
                    Try again
                  </Button>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-4 py-10 text-center">
                  <Package className="size-8 text-muted-foreground/70" />
                  <p className="font-medium">
                    {products.length ? "No matching products" : "Your menu is empty"}
                  </p>
                  <p className="max-w-sm text-sm text-muted-foreground">
                    {products.length
                      ? "Try a different search or clear one of the filters."
                      : "Add a product above to start building the checkout menu."}
                  </p>
                  {products.length > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setProductSearch("");
                        setCategoryFilter("all");
                        setAvailabilityFilter("all");
                      }}
                    >
                      Clear filters
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
                  {filteredProducts.map((product) => (
                    <Card
                      key={product.id}
                      size="sm"
                      className="gap-0 rounded-xl border border-border/80 py-0 shadow-none transition-colors hover:border-primary/40"
                    >
                      <CardContent className="flex min-w-0 items-center gap-3 p-3">
                        <div
                          className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${
                            product.isAvailable
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground"
                          } relative overflow-hidden`}
                        >
                          {product.imageUrl ? (
                            <Image
                              src={product.imageUrl}
                              alt=""
                              fill
                              unoptimized
                              sizes="40px"
                              className="object-cover"
                            />
                          ) : product.isAvailable ? (
                            <CircleCheck className="size-5" />
                          ) : (
                            <CircleOff className="size-5" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex min-w-0 items-center gap-2">
                            <p className="truncate text-sm font-semibold">
                              {product.name}
                            </p>
                            <Badge
                              variant={
                                product.isAvailable ? "secondary" : "outline"
                              }
                              className="h-5 px-1.5 text-[10px]"
                            >
                              {product.isAvailable ? "Live" : "Paused"}
                            </Badge>
                          </div>
                          <div className="mt-1 flex min-w-0 items-center gap-2">
                            <span className="truncate text-xs text-muted-foreground">
                              {product.category || "Uncategorized"}
                            </span>
                            <span
                              aria-hidden="true"
                              className="size-1 shrink-0 rounded-full bg-border"
                            />
                            <span className="shrink-0 text-xs font-medium tabular-nums text-foreground">
                              {formatPaisa(product.pricePaisa)}
                            </span>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Edit ${product.name}`}
                            title={`Edit ${product.name}`}
                            onClick={() => editProduct(product)}
                          >
                            <Pencil />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={
                              product.isAvailable
                                ? `Pause ${product.name}`
                                : `Make ${product.name} available`
                            }
                            title={
                              product.isAvailable
                                ? "Hide from checkout"
                                : "Show in checkout"
                            }
                            disabled={updateProductMutation.isPending}
                            onClick={() => void toggleAvailability(product)}
                          >
                            {product.isAvailable ? (
                              <CircleOff />
                            ) : (
                              <CircleCheck />
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="xl:sticky xl:top-4">
          <CardHeader className="border-b border-border/70 pb-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>Categories</CardTitle>
                <CardDescription className="mt-1">
                  Organize products for quick checkout filtering.
                </CardDescription>
              </div>
              <Badge variant="outline">{categories.length}</Badge>
            </div>
            <CardDescription>
              Organize items for checkout. Renaming updates assigned products;
              reassign products before deleting a category.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <form className="flex gap-2" onSubmit={addCategory}>
              <Field className="min-w-0 flex-1 gap-1">
                <FieldLabel className="sr-only" htmlFor="new-category">
                  New category name
                </FieldLabel>
                <Input
                  id="new-category"
                  placeholder="e.g. Cold drinks"
                  maxLength={60}
                  required
                  value={newCategoryName}
                  onChange={(event) => setNewCategoryName(event.target.value)}
                />
              </Field>
              <Button
                type="submit"
                size="icon"
                aria-label="Add category"
                title="Add category"
                disabled={
                  createCategoryMutation.isPending ||
                  newCategoryName.trim().length === 0
                }
              >
                {createCategoryMutation.isPending ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Plus />
                )}
              </Button>
            </form>

            {categoryError && (
              <p role="alert" className="text-sm text-destructive">
                {categoryError}
              </p>
            )}

            {categoriesQuery.isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="size-6 animate-spin text-primary" />
              </div>
            ) : categoriesQuery.isError ? (
              <div className="space-y-3 rounded-xl border border-destructive/20 bg-destructive/5 p-3">
                <p role="alert" className="text-sm text-destructive">
                  Could not load categories. Check the API connection and database migration.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void categoriesQuery.refetch()}
                >
                  Try again
                </Button>
              </div>
            ) : categories.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border px-4 py-6 text-center">
                <p className="text-sm font-medium">No categories yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Add one above to assign products to a group.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {categories.map((item) => {
                  const productCount =
                    productCountsByCategory.get(item.name) ?? 0;
                  const isEditing = editingCategoryId === item.id;
                  const isConfirmingDelete = confirmDeleteId === item.id;

                  return (
                    <div
                      key={item.id}
                      className="rounded-xl border border-border p-3"
                    >
                      {isEditing ? (
                        <form
                          className="flex gap-2"
                          onSubmit={(event) => {
                            event.preventDefault();
                            void saveCategoryName(item.id);
                          }}
                        >
                          <Input
                            aria-label={`Rename ${item.name}`}
                            maxLength={60}
                            autoFocus
                            value={editingCategoryName}
                            onChange={(event) =>
                              setEditingCategoryName(event.target.value)
                            }
                          />
                          <Button
                            type="submit"
                            size="icon"
                            aria-label="Save category name"
                            disabled={
                              updateCategoryMutation.isPending ||
                              editingCategoryName.trim().length === 0
                            }
                          >
                            {updateCategoryMutation.isPending ? (
                              <Loader2 className="animate-spin" />
                            ) : (
                              <Check />
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            aria-label="Cancel category rename"
                            onClick={() => setEditingCategoryId(null)}
                          >
                            <X />
                          </Button>
                        </form>
                      ) : isConfirmingDelete ? (
                        <div className="space-y-3">
                          <p className="text-sm">
                            Delete <strong>{item.name}</strong>? This cannot be undone.
                          </p>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              disabled={deleteCategoryMutation.isPending}
                              onClick={() => void removeCategory(item.id)}
                            >
                              {deleteCategoryMutation.isPending && (
                                <Loader2 className="animate-spin" />
                              )}
                              Delete category
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setConfirmDeleteId(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                              <Package className="size-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">
                                {item.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {productCount}{" "}
                                {productCount === 1 ? "product" : "products"}
                              </p>
                            </div>
                          </div>
                          <div className="flex shrink-0 gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label={`Rename ${item.name}`}
                              title={`Rename ${item.name}`}
                              onClick={() => {
                                setEditingCategoryId(item.id);
                                setEditingCategoryName(item.name);
                                setCategoryError("");
                              }}
                            >
                              <Pencil />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label={`Delete ${item.name}`}
                              title={
                                productCount > 0
                                  ? "Reassign its products before deleting"
                                  : `Delete ${item.name}`
                              }
                              disabled={
                                productCount > 0 ||
                                deleteCategoryMutation.isPending
                              }
                              onClick={() => setConfirmDeleteId(item.id)}
                            >
                              <Trash2 />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProductsPage;
