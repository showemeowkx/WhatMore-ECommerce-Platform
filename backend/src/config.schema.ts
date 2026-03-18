import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
  MIN_ORDER_AMNT: Joi.number().default(500),

  POSTGRES_USER: Joi.string().required(),
  POSTGRES_PASSWORD: Joi.string().required(),
  POSTGRES_DB: Joi.string().required(),
  POSTGRES_HOST: Joi.string().default('postgres'),
  POSTGRES_PORT: Joi.number().default(5352),

  PORT: Joi.number().default(3000),

  REDIS_URL: Joi.string().required(),
  CACHE_TTL_MILISECONDS: Joi.string().default(3600000),

  JWT_ACCESS_SECRET: Joi.string().required(),
  JWT_ACCESS_EXPIRE_TIME: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_REFRESH_EXPIRE_TIME: Joi.string().default('7d'),

  CLOUDINARY_CLOUD_NAME: Joi.string().required(),
  CLOUDINARY_API_KEY: Joi.string().required(),
  CLOUDINARY_API_SECRET: Joi.string().required(),

  DEFAULT_CATEGORY_ICONS: Joi.string().default(
    'https://res.cloudinary.com/dgsoaci96/image/upload/v1771695537/default_category_gh6tmc.png,https://res.cloudinary.com/dgsoaci96/image/upload/v1771695537/drinks_zpvagw.png,https://res.cloudinary.com/dgsoaci96/image/upload/v1771695535/bread_xp5fpb.png,https://res.cloudinary.com/dgsoaci96/image/upload/v1771695535/bread2_h5jrsb.png,https://res.cloudinary.com/dgsoaci96/image/upload/v1771695541/fruits_cdsi75.png,https://res.cloudinary.com/dgsoaci96/image/upload/v1771695535/vegetable_uclmwd.png,https://res.cloudinary.com/dgsoaci96/image/upload/v1771695544/healthy-food_uclnrr.png,https://res.cloudinary.com/dgsoaci96/image/upload/v1771695539/flower_mknkso.png,https://res.cloudinary.com/dgsoaci96/image/upload/v1771695551/plant_zuyek5.png,https://res.cloudinary.com/dgsoaci96/image/upload/v1771695542/grocery_elzddn.png,https://res.cloudinary.com/dgsoaci96/image/upload/v1771695543/grocery2_tlxdks.png,https://res.cloudinary.com/dgsoaci96/image/upload/v1771695546/meat_oukaco.png,https://res.cloudinary.com/dgsoaci96/image/upload/v1771695554/sausage_bufusq.png,https://res.cloudinary.com/dgsoaci96/image/upload/v1771695554/sausage3_iwina5.png,https://res.cloudinary.com/dgsoaci96/image/upload/v1771695554/sausage2_rqlywi.png,https://res.cloudinary.com/dgsoaci96/image/upload/v1771695535/cheese_xxch8w.png,https://res.cloudinary.com/dgsoaci96/image/upload/v1771695545/milk_products_qqukyy.png,https://res.cloudinary.com/dgsoaci96/image/upload/v1771695547/milk_qz3p3y.png,https://res.cloudinary.com/dgsoaci96/image/upload/v1771695540/freezed_amx4ya.png,https://res.cloudinary.com/dgsoaci96/image/upload/v1771695540/freezer_aq5lka.png,https://res.cloudinary.com/dgsoaci96/image/upload/v1771695544/ice_cream_iulavf.png,https://res.cloudinary.com/dgsoaci96/image/upload/v1771695538/fish_nliejp.png,https://res.cloudinary.com/dgsoaci96/image/upload/v1771695537/drinks2_dj3ogt.png,https://res.cloudinary.com/dgsoaci96/image/upload/v1771695536/coffee_tea_l5lync.png,https://res.cloudinary.com/dgsoaci96/image/upload/v1771695557/sweets_sk1ewa.png,https://res.cloudinary.com/dgsoaci96/image/upload/v1771695554/snacks_bpqtaf.png,https://res.cloudinary.com/dgsoaci96/image/upload/v1771695550/pizza_ronine.png,https://res.cloudinary.com/dgsoaci96/image/upload/v1771695535/checmicals_fpzftn.png,https://res.cloudinary.com/dgsoaci96/image/upload/v1771695550/pet_food_qndcls.png,https://res.cloudinary.com/dgsoaci96/image/upload/v1771695551/products_l4fiof.png,https://res.cloudinary.com/dgsoaci96/image/upload/v1771695548/pantry_p2oait.png,https://res.cloudinary.com/dgsoaci96/image/upload/v1771695554/shop_hj4b5j.png,https://res.cloudinary.com/dgsoaci96/image/upload/v1771695549/parts_jz5gtb.png,https://res.cloudinary.com/dgsoaci96/image/upload/v1771695547/new_lssoau.png,https://res.cloudinary.com/dgsoaci96/image/upload/v1771695549/person_w8uvyg.png',
  ),
  DEFAULT_USER_PFP: Joi.string().default(
    'https://res.cloudinary.com/dgsoaci96/image/upload/v1769207269/user_default_i73dfk.jpg',
  ),
  DEFAULT_PRODUCT_IMAGE: Joi.string().default(
    'https://res.cloudinary.com/dgsoaci96/image/upload/v1769209222/product_default_pzutee.jpg',
  ),

  UKRSKLAD_DB_HOST: Joi.string().default('host.docker.internal'),
  UKRSKLAD_DB_PORT: Joi.number().default(3050),
  UKRSKLAD_DB_PATH: Joi.string().required(),
  UKRSKLAD_DB_USER: Joi.string().default('SYSDBA'),
  UKRSKLAD_DB_PASSWORD: Joi.string().default('masterkey'),

  VERIFICATION_CODE_EXPIRE_MINUTES: Joi.number().default(5),
  TURBOSMS_TOKEN: Joi.string().required(),
  TURBOSMS_SENDER: Joi.string().required(),

  NP_API_KEY: Joi.string().required(),
});
