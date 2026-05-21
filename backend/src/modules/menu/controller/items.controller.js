import MenuService from "../../../utils/menuService.js";
import { asyncHandler } from "../../../utils/errorHandling.js";
import { prisma } from "../../../utils/prismaClient.js";

const normalizeString = (value) =>
  typeof value === "string" ? value.trim() : undefined;

const getBranchCode = async (req) => {
  const branchCandidates = [
    normalizeString(req?.query?.branchCode),
    normalizeString(req?.query?.branch_code),
    normalizeString(req?.headers?.["x-branch-code"]),
    normalizeString(req?.headers?.["x-branchcode"]),
    normalizeString(process.env.DEFAULT_BRANCH_CODE),
    normalizeString(process.env.BRANCH_CODE),
  ].filter(Boolean);

  if (branchCandidates.length > 0) {
    return branchCandidates[0];
  }

  const restaurant = await prisma.restaurantInfo.findFirst({
    select: { branch_code: true },
  });

  if (restaurant?.branch_code) {
    return restaurant.branch_code;
  }

  throw new Error("No branch_code found in restaurant_info");
};

const getPagination = (query) => {
  const page = Math.max(parseInt(query.page) || 1, 1);
  const limit = Math.max(parseInt(query.limit) || 10, 1);
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

export const getBranches = asyncHandler(async (_req, res) => {
  const branches = await prisma.restaurantBranch.findMany({
    select: {
      branch_code: true,
      branch_name: true,
      company: true,
    },
    orderBy: {
      branch_name: "asc",
    },
  });

  const normalizedBranches = branches
    .map((branch) => ({
      code: normalizeString(branch.branch_code),
      name:
        normalizeString(branch.branch_name) ||
        normalizeString(branch.branch_code) ||
        "",
      company: normalizeString(branch.company),
    }))
    .filter((branch) => Boolean(branch.code && branch.name));

  res.json({
    success: true,
    data: normalizedBranches,
    count: normalizedBranches.length,
  });
});

export const getMenuItems = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const branch_code = await getBranchCode(req);

  const items = await MenuService.fetchMenuItems(branch_code, limit, offset);
  const total = await MenuService.countMenuItems(branch_code);

  res.json({
    success: true,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: items,
  });
});

export const getAllCategories = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const branch_code = await getBranchCode(req);

  const categories = await MenuService.fetchAllMenuCategories(
    branch_code,
    limit,
    offset
  );
  const total = await MenuService.countAllMenuCategories(branch_code);

  res.json({
    success: true,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: categories,
  });
});

export const getParentCategories = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const branch_code = await getBranchCode(req);

  const categories = await MenuService.fetchParentCategories(
    branch_code,
    limit,
    offset
  );
  const total = await MenuService.countParentCategories(branch_code);

  res.json({
    success: true,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: categories,
  });
});

export const getSubCategories = asyncHandler(async (req, res) => {
  const { parentId } = req.params;
  const { page, limit, offset } = getPagination(req.query);
  const branch_code = await getBranchCode(req);

  const categories = await MenuService.fetchSubCategories(
    branch_code,
    parentId,
    limit,
    offset
  );
  const total = await MenuService.countSubCategories(branch_code, parentId);

  res.json({
    success: true,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: categories,
  });
});

export const getAdminItems = asyncHandler(async (req, res) => {
  const branch_code = normalizeString(req.query.branchCode || req.query.branch_code);
  const where = branch_code ? { branch_code } : {};

  const items = await prisma.itemMaster.findMany({
    where,
    orderBy: { item_order: "asc" },
  });

  const data = items.map((item) => ({
    id: item.itm_code,
    itm_code: item.itm_code,
    name: item.website_name_en || item.itm_name,
    nameAr: item.website_name_ar,
    itm_name: item.itm_name,
    website_name_en: item.website_name_en,
    website_name_ar: item.website_name_ar,
    website_description_en: item.website_description_en,
    website_description_ar: item.website_description_ar,
    order: item.item_order,
    itemOrder: item.item_order,
    item_order: item.item_order,
    description: item.website_description_en,
    descriptionAr: item.website_description_ar,
    price: item.sales_price != null ? Number(item.sales_price).toFixed(2) : "",
    sales_price: item.sales_price,
    category: item.itm_group_code,
    itm_group_code: item.itm_group_code,
    image: item.image?.trim() || "",
    show_in_website: item.show_in_website,
    saleable: item.saleable,
    branchCode: item.branch_code,
    branch_code: item.branch_code,
    fasting: item.fasting === true,
    vegetarian: item.vegetarian === true,
    healthyChoice: item.healthy_choice === true,
    signatureDish: item.signature_dish === true,
    spicy: item.spicy === true,
  }));

  res.json({ success: true, data });
});

export const getAdminCategories = asyncHandler(async (req, res) => {
  const branch_code = normalizeString(req.query.branchCode || req.query.branch_code);
  const where = branch_code ? { branch_code } : {};

  const cats = await prisma.itemMainGroup.findMany({
    where,
    orderBy: { order_group: "asc" },
  });

  const data = cats.map((cat) => ({
    id: cat.itm_group_code,
    itm_group_code: cat.itm_group_code,
    itm_group_name: cat.itm_group_name,
    name: cat.website_name_en || cat.itm_group_name,
    nameAr: cat.website_name_ar,
    website_name_en: cat.website_name_en,
    website_name_ar: cat.website_name_ar,
    orderGroup: cat.order_group,
    order_group: cat.order_group,
    nested_level: Number(cat.nested_level),
    parent_group_code: cat.parent_group_code,
    path: cat.path,
    show_in_website: cat.show_in_website,
    saleable: cat.saleable,
    comment_en: cat.comment_en,
    comment_ar: cat.comment_ar,
    branchCode: cat.branch_code,
    branch_code: cat.branch_code,
    children: [],
  }));

  res.json({ success: true, data });
});

export const createMenuItem = asyncHandler(async (req, res) => {
  const branch_code = normalizeString(req.query.branch_code || req.body.branch_code);
  const {
    itm_code, itm_name, website_name_en, website_name_ar,
    website_description_en, website_description_ar,
    sales_price, itm_group_code, image,
    show_in_website, saleable,
    fasting, vegetarian, healthy_choice, signature_dish, spicy,
  } = req.body;

  const data = await prisma.itemMaster.create({
    data: {
      itm_code,
      itm_name: itm_name ?? "",
      website_name_en: website_name_en ?? null,
      website_name_ar: website_name_ar ?? null,
      website_description_en: website_description_en ?? null,
      website_description_ar: website_description_ar ?? null,
      sales_price: sales_price != null ? parseFloat(sales_price) : null,
      itm_group_code: itm_group_code ?? null,
      image: image ?? null,
      show_in_website: show_in_website ?? true,
      saleable: saleable ?? true,
      fasting: fasting ?? false,
      vegetarian: vegetarian ?? false,
      healthy_choice: healthy_choice ?? false,
      signature_dish: signature_dish ?? false,
      spicy: spicy ?? false,
      branch_code: branch_code ?? null,
    },
  });
  res.status(201).json({ success: true, data });
});

export const updateMenuItem = asyncHandler(async (req, res) => {
  const { itm_code } = req.params;
  const branch_code = normalizeString(req.query.branch_code || req.body.branch_code);

  const {
    itm_name, website_name_en, website_name_ar,
    website_description_en, website_description_ar,
    sales_price, itm_group_code, image,
    show_in_website, saleable,
    fasting, vegetarian, healthy_choice, signature_dish, spicy,
  } = req.body;

  const updateData = {};
  const { item_order } = req.body;
  if (itm_name !== undefined) updateData.itm_name = itm_name;
  if (website_name_en !== undefined) updateData.website_name_en = website_name_en;
  if (website_name_ar !== undefined) updateData.website_name_ar = website_name_ar;
  if (website_description_en !== undefined) updateData.website_description_en = website_description_en;
  if (website_description_ar !== undefined) updateData.website_description_ar = website_description_ar;
  if (sales_price !== undefined) updateData.sales_price = sales_price !== null ? parseFloat(sales_price) : null;
  if (itm_group_code !== undefined) updateData.itm_group_code = itm_group_code;
  if (image !== undefined) updateData.image = image;
  if (show_in_website !== undefined) updateData.show_in_website = show_in_website;
  if (saleable !== undefined) updateData.saleable = saleable;
  if (fasting !== undefined) updateData.fasting = fasting;
  if (vegetarian !== undefined) updateData.vegetarian = vegetarian;
  if (healthy_choice !== undefined) updateData.healthy_choice = healthy_choice;
  if (signature_dish !== undefined) updateData.signature_dish = signature_dish;
  if (spicy !== undefined) updateData.spicy = spicy;
  if (item_order !== undefined) updateData.item_order = item_order;

  const where = { item_master_code_branch_code_unique: { itm_code, branch_code: branch_code ?? null } };

  const data = await prisma.itemMaster.update({ where, data: updateData });
  res.json({ success: true, data });
});

export const deleteMenuItem = asyncHandler(async (req, res) => {
  const { itm_code } = req.params;
  const branch_code = normalizeString(req.query.branch_code);

  await prisma.itemMaster.deleteMany({
    where: { itm_code, ...(branch_code ? { branch_code } : {}) },
  });
  res.json({ success: true });
});

export const createCategory = asyncHandler(async (req, res) => {
  const branch_code = normalizeString(req.query.branch_code || req.body.branch_code);
  const {
    itm_group_code, itm_group_name, website_name_en, website_name_ar,
    order_group, nested_level, parent_group_code, path,
    show_in_website, saleable, comment_en, comment_ar,
  } = req.body;

  const data = await prisma.itemMainGroup.create({
    data: {
      itm_group_code,
      itm_group_name: itm_group_name ?? "",
      website_name_en: website_name_en ?? null,
      website_name_ar: website_name_ar ?? null,
      order_group: order_group ?? null,
      nested_level: nested_level ?? 1,
      parent_group_code: parent_group_code ?? null,
      path: path ?? null,
      show_in_website: show_in_website ?? null,
      saleable: saleable ?? null,
      comment_en: comment_en ?? null,
      comment_ar: comment_ar ?? null,
      branch_code: branch_code ?? null,
    },
  });
  res.status(201).json({ success: true, data });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const { itm_group_code } = req.params;
  const branch_code = normalizeString(req.query.branch_code || req.body.branch_code);

  const {
    itm_group_name, website_name_en, website_name_ar,
    order_group, nested_level, parent_group_code, path,
    show_in_website, saleable, comment_en, comment_ar,
  } = req.body;

  const updateData = {};
  if (itm_group_name !== undefined) updateData.itm_group_name = itm_group_name;
  if (website_name_en !== undefined) updateData.website_name_en = website_name_en;
  if (website_name_ar !== undefined) updateData.website_name_ar = website_name_ar;
  if (order_group !== undefined) updateData.order_group = order_group;
  if (nested_level !== undefined) updateData.nested_level = nested_level;
  if (parent_group_code !== undefined) updateData.parent_group_code = parent_group_code;
  if (path !== undefined) updateData.path = path;
  if (show_in_website !== undefined) updateData.show_in_website = show_in_website;
  if (saleable !== undefined) updateData.saleable = saleable;
  if (comment_en !== undefined) updateData.comment_en = comment_en;
  if (comment_ar !== undefined) updateData.comment_ar = comment_ar;

  const where = { item_main_group_code_branch_code_unique: { itm_group_code, branch_code: branch_code ?? null } };

  const data = await prisma.itemMainGroup.update({ where, data: updateData });
  res.json({ success: true, data });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const { itm_group_code } = req.params;
  const branch_code = normalizeString(req.query.branch_code);

  await prisma.itemMainGroup.deleteMany({
    where: { itm_group_code, ...(branch_code ? { branch_code } : {}) },
  });
  res.json({ success: true });
});
