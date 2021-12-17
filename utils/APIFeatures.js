class APIFeatures {
  constructor(mongooseQuery, requestQuery) {
    this.mongooseQuery = mongooseQuery;
    this.requestQuery = requestQuery;
    this.excludedFields = ['page', 'limit', 'sort', 'fields'];
  }

  filter() {
    let queryObj = { ...this.requestQuery };
    this.excludedFields.forEach(key => delete queryObj[key]);
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
    queryObj = JSON.parse(queryStr);
    this.mongooseQuery = this.mongooseQuery.find(queryObj);

    return this;
  }

  sort() {
    if (this.requestQuery.sort) {
      const sortBy = this.requestQuery.sort.split(',').join(' ');
      this.mongooseQuery = this.mongooseQuery.sort(sortBy);
    } else {
      this.mongooseQuery = this.mongooseQuery.sort('createdAt');
    }
    return this;
  }

  project() {
    if (this.requestQuery.fields) {
      const fields = this.requestQuery.fields.split(',').join(' ');
      this.mongooseQuery = this.mongooseQuery.select(`${fields} -__v`);
    } else {
      this.mongooseQuery = this.mongooseQuery.select('-__v');
    }
    return this;
  }

  paginate() {
    const page = this.requestQuery.page || 1;
    const limit = this.requestQuery.limit || 10;
    const skip = (page - 1) * limit;
    this.mongooseQuery = this.mongooseQuery.skip(skip).limit(limit);
    return this;
  }
}

module.exports = APIFeatures;
