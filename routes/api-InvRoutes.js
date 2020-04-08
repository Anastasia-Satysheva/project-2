const db = require("../models");
// WHY IS THIS HERE!? const _ = require("underscore");
const Op = db.Sequelize.Op;

//all this code should be refactored to actually use stuff route object from express look at api-routes to learn how to use it....
/*
 'dbInvoice2' is assigned a value but never used  no-unused-vars
   53:11  error  'dbInvoice' is assigned a value but never used   no-unused-vars
  287:37  error  'dbInvoice' is defined but never used            no-unused-vars
  313:43  error  'dbInvoice' is defined but never used            no-unused-vars
  319:47  error  'dbPayment' is defined but never used            no-unused-vars
  358:55  error  'dbInvoice' is defined but never used            no-unused-vars
  383:25  error  'dbPayment' is defined but never used            no-unused-vars
  412:35  error  'dbInvoice' is defined but never used            no-unused-vars
  455:33  error  'dbInvoice'
  //--------run two
     67:11  error  'dbInvoice' is assigned a value but never used  no-unused-vars
  302:37  error  'dbInvoice' is defined but never used           no-unused-vars
  328:43  error  'dbInvoice' is defined but never used           no-unused-vars
  334:47  error  'dbPayment' is defined but never used           no-unused-vars
  373:55  error  'dbInvoice' is defined but never used           no-unused-vars
  398:25  error  'dbPayment' is defined but never used           no-unused-vars
  427:35  error  'dbInvoice' is defined but never used           no-unused-vars
  470:33  error  'dbInvoice' is defined but never used           no-unused-vars

 //all lint errors this file is commented how till Anna refactores it */
module.exports = {
  // function for creating a new customer
  postCustomerApi: async function(req, res) {
    console.log(req.body);
    const dbCustomer = await db.Customer.create(req.body);
    res.json(dbCustomer);
  },
  // function for creating a new sales order
  postOrderApi: async function(req, res) {
    console.log("Body:", req.body);
    const dbOrder = await db.Order.create(req.body);
    res.json(dbOrder);
  },
  // function for creating a new invoice
  postInvoiceApi: async function(req, res) {
    const dbInvoice = await db.Invoice.create(req.body);
    const salesorderId = dbInvoice.dataValues.salesorder_id;
    // automatically assign the amount of the invoice based on the amount of the given sales order
    const dbOrders = await db.Order.findAll({ where: { id: salesorderId } });
    const amount = dbOrders[0].amount;
    const dbInvoice2 = await db.Invoice.update(
      { total_amount: amount },
      { where: { id: dbInvoice.dataValues.id } }
    );
    console.log(dbInvoice2);
    console.log(dbInvoice);
    res.json({ dbInvoice });
  },
  // function for creating a new payment
  postPaymentApi: async function(req, res) {
    const dbPayment = await db.Payment.create(req.body);
    const invoiceId = dbPayment.dataValues.invoice_id;
    // after a new payment is created, grab all the payments for the given invoice and calculate how much has been paid toward that invoice
    const dbPayments = await db.Payment.findAll({
      where: { invoice_id: invoiceId },
    });
    let totalPaid = 0;
    for (let i = 0; i < dbPayments.length; i++) {
      const amount = parseFloat(dbPayments[i].amount);
      totalPaid = totalPaid + amount;
    }
    const dbInvoices = await db.Invoice.findAll({ where: { id: invoiceId } });
    console.log(invoiceId, dbInvoices[0].total_amount);
    // evaluate whether the invoice has been paid in full
    let isPaid;
    if (dbInvoices[0].total_amount - req.body.discount - totalPaid > 0) {
      isPaid = false;
    } else {
      isPaid = true;
    }
    const dbInvoice = await db.Invoice.update(
      { amount_paid: totalPaid, paid: isPaid },
      { where: { id: invoiceId } }
    );
    console.log(dbInvoice); //called now but still never used
    console.log(dbPayment); //called now neber used still
    res.json(dbPayment);
  },
  api: function(app) {
    // Get all customers
    app.get("/api/customers", function(req, res) {
      db.Customer.findAll({}).then(function(dbCustomers) {
        res.json(dbCustomers);
      });
    });

    // Get a customer
    app.get("/api/customers/:id", function(req, res) {
      console.log({ id: req.params.id });
      db.Customer.findAll({ where: { id: req.params.id } }).then(function(
        dbCustomers
      ) {
        console.log(dbCustomers);
        res.json(dbCustomers);
      });
    });

    // Get all customers that have name like the searched term
    app.get("/customers/search-by-name/:name", (req, res) => {
      db.Customer.findAll({
        where: { name: { [Op.like]: "%" + req.params.name + "%" } },
      })
        .then((results) => {
          res.json(results);
        })
        .catch((err) => console.log(err));
    });
    // Get all customers with phone number that matches the searched term
    app.get("/customers/search-by-phone/:phone", (req, res) => {
      db.Customer.findAll({ where: { phone_number: req.params.phone } })
        .then((results) => res.json(results))
        .catch((err) => console.log(err));
    });

    // Create a new customer
    app.post("/api/customers", this.postCustomerApi);

    // Get all sales orders
    app.get("/api/salesorders", function(req, res) {
      db.Order.findAll({}).then(function(dbOrder) {
        res.json(dbOrder);
      });
    });

    // Get a sales order
    app.get("/api/salesorders/:id", function(req, res) {
      console.log({ id: req.params.id });
      db.Order.findAll({ where: { id: req.params.id } }).then(function(
        dbOrders
      ) {
        console.log(dbOrders);
        res.json(dbOrders);
      });
    });

    // Create a new sales order
    app.post("/api/salesorders", this.postOrderApi);

    // Get all invoices
    app.get("/api/invoices", function(req, res) {
      db.Invoice.findAll({}).then(function(dbInvoice) {
        res.json(dbInvoice);
      });
    });

    // Get an invoice
    app.get("/api/invoices/:id", function(req, res) {
      console.log({ id: req.params.id });
      db.Invoice.findAll({ where: { id: req.params.id } }).then(function(
        dbInvoices
      ) {
        console.log(dbInvoices);
        res.json(dbInvoices[0]);
      });
    });

    // Get Paid and Unpaid Invoice report
    app.get("/api/invoice/report", (req, res) => {
      console.log("Getting reports....");
      db.Invoice.findAll({ where: { paid: true } }).then((report1) => {
        if (report1) {
          let paidreport = report1.map((item) => item.dataValues);
          db.Invoice.findAll({ where: { paid: false } }).then((report2) => {
            let unpaidreport = report2.map((item) => item.dataValues);
            let report = {
              unpaid: unpaidreport,
              paid: paidreport,
            };
            res.json(report);
          });
        } else {
          console.log("Gand Marwao");
          return "gand marwao";
        }
      });
    });

    // Create a new invoice
    app.post("/api/invoices", this.postInvoiceApi);

    // Update an invoice
    app.put("/api/invoices/:id", function(req, res) {
      if (req.body.salesorder_id) {
        db.Invoice.update(
          { salesorder_id: req.body.salesorder_id },
          { where: { id: req.params.id } }
        ).then(function(dbInvoice) {
          if (req.body.discount) {
            // if we are updating the discount, we have to reevaluate whether the invoice has been paid in full
            db.Invoice.findAll({ where: { id: req.params.id } }).then(function(
              dbInvoices
            ) {
              let isPaid;
              if (
                dbInvoices[0].total_amount -
                  req.body.discount -
                  dbInvoices[0].amount_paid >
                0
              ) {
                isPaid = false;
              } else {
                isPaid = true;
              }
              db.Invoice.update(
                { discount: req.body.discount, paid: isPaid },
                { where: { id: req.params.id } }
              ).then(function(dbInvoice) {
                res.json(dbInvoice);
              });
            });
          } else {
            res.json(dbInvoice);
          }
        });
      } else if (req.body.discount) {
        db.Invoice.findAll({ where: { id: req.params.id } }).then(function(
          dbInvoices
        ) {
          // if we are updating the discount, we have to reevaluate whether the invoice has been paid in full
          let isPaid;
          if (
            dbInvoices[0].total_amount -
              req.body.discount -
              dbInvoices[0].amount_paid >
            0
          ) {
            isPaid = false;
          } else {
            isPaid = true;
          }
          db.Invoice.update(
            { discount: req.body.discount, paid: isPaid },
            { where: { id: req.params.id } }
          ).then(function(dbInvoice) {
            res.json(dbInvoice);
          });
        });
      }
    });

    // Delete an invoice by id
    app.delete("/api/invoices/:id", function(req, res) {
      db.Invoice.destroy({ where: { id: req.params.id } }).then(function(
        dbInvoice
      ) {
        res.json(dbInvoice);
      });
    });

    // Get all payments
    app.get("/api/payments", function(req, res) {
      db.Payment.findAll({}).then(function(dbPayment) {
        res.json(dbPayment);
      });
    });

    // Get a payment
    app.get("/api/payments/:id", function(req, res) {
      console.log({ id: req.params.id });
      db.Payment.findAll({ where: { id: req.params.id } }).then(function(
        dbPayments
      ) {
        console.log(dbPayments);
        res.json(dbPayments[0]);
      });
    });

    // Create a new payment
    app.post("/api/payments", this.postPaymentApi);

    // Update a payment
    app.put("/api/payments/:id", function(req, res) {
      if (req.body.invoice_id) {
        db.Payment.findAll({ where: { id: req.params.id } }).then(function(
          dbPayment
        ) {
          // if we are changing the invoice to which a payment is applied, we have to recalculate how much has been paid on the original invoice as well as the new one, as well as determine whether they both have been paid in full
          const oldInvoiceId = dbPayment[0].invoice_id;
          db.Payment.update(
            { invoice_id: req.body.invoice_id },
            { where: { id: req.params.id } }
          ).then(function(dbPayment) {
            db.Payment.findAll({ where: { invoice_id: oldInvoiceId } }).then(
              function(dbPayments) {
                let totalPaid = 0;
                for (let i = 0; i < dbPayments.length; i++) {
                  const amount = parseFloat(dbPayments[i].amount);
                  totalPaid = totalPaid + amount;
                }
                db.Invoice.findAll({ where: { id: oldInvoiceId } }).then(
                  function(dbInvoices) {
                    let isPaid;
                    if (
                      dbInvoices[0].total_amount -
                        dbInvoices[0].discount -
                        totalPaid >
                      0
                    ) {
                      isPaid = false;
                    } else {
                      isPaid = true;
                    }
                    console.log(isPaid);
                    db.Invoice.update(
                      { amount_paid: totalPaid, paid: isPaid },
                      { where: { id: oldInvoiceId } }
                    ).then(function(dbInvoice) {
                      console.log(dbInvoice); //called now but never used
                      db.Payment.findAll({
                        where: { invoice_id: req.body.invoice_id },
                      }).then(function(dbPayments) {
                        let totalPaid = 0;
                        for (let i = 0; i < dbPayments.length; i++) {
                          const amount = parseFloat(dbPayments[i].amount);
                          totalPaid = totalPaid + amount;
                        }
                        db.Invoice.findAll({
                          where: { id: req.body.invoice_id },
                        }).then(function(dbInvoices) {
                          let isPaid;
                          if (
                            dbInvoices[0].total_amount -
                              dbInvoices[0].discount -
                              totalPaid >
                            0
                          ) {
                            isPaid = false;
                          } else {
                            isPaid = true;
                          }
                          db.Invoice.update(
                            { amount_paid: totalPaid, paid: isPaid },
                            { where: { id: req.body.invoice_id } }
                          ).then(function(dbInvoice) {
                            console.log(dbInvoice); //called now never used
                            if (req.body.amount) {
                              // if changing the amount of a payment, reevaluate how much has been paid toward that invoice and whether it has been paid in full
                              db.Payment.update(
                                { amount: req.body.amount },
                                { where: { id: req.params.id } }
                              ).then(function(dbPayment) {
                                console.log(dbPayment); //called still never used
                                db.Payment.findAll({
                                  where: { id: req.params.id },
                                }).then(function(dbPayment) {
                                  const invoiceId = dbPayment[0].invoice_id;
                                  db.Payment.findAll({
                                    where: { invoice_id: invoiceId },
                                  }).then(function(dbPayments) {
                                    let totalPaid = 0;
                                    for (
                                      let i = 0;
                                      i < dbPayments.length;
                                      i++
                                    ) {
                                      const amount = parseFloat(
                                        dbPayments[i].amount
                                      );
                                      totalPaid = totalPaid + amount;
                                    }
                                    db.Invoice.findAll({
                                      where: { id: invoiceId },
                                    }).then(function(dbInvoices) {
                                      let isPaid;
                                      if (
                                        dbInvoices[0].total_amount -
                                          dbInvoices[0].discount -
                                          totalPaid >
                                        0
                                      ) {
                                        isPaid = false;
                                      } else {
                                        isPaid = true;
                                      }
                                      db.Invoice.update(
                                        {
                                          amount_paid: totalPaid,
                                          paid: isPaid,
                                        },
                                        { where: { id: invoiceId } }
                                      ).then(function(dbInvoice) {
                                        console.log(dbInvoice); //called still never used
                                        res.json(dbPayment);
                                      });
                                    });
                                  });
                                });
                              });
                            } else {
                              res.json(dbPayment);
                            }
                          });
                        });
                      });
                    });
                  }
                );
              }
            );
          });
        });
      } else if (req.body.amount) {
        // if changing the amount of a payment, reevaluate how much has been paid toward that invoice and whether it has been paid in full
        db.Payment.update(
          { amount: req.body.amount },
          { where: { id: req.params.id } }
        ).then(function(dbPayment) {
          console.log(dbPayment); //called never used
          db.Payment.findAll({ where: { id: req.params.id } }).then(function(
            dbPayment
          ) {
            const invoiceId = dbPayment[0].invoice_id;
            db.Payment.findAll({ where: { invoice_id: invoiceId } }).then(
              function(dbPayments) {
                let totalPaid = 0;
                for (let i = 0; i < dbPayments.length; i++) {
                  const amount = parseFloat(dbPayments[i].amount);
                  totalPaid = totalPaid + amount;
                }
                db.Invoice.findAll({ where: { id: invoiceId } }).then(function(
                  dbInvoices
                ) {
                  let isPaid;
                  if (
                    dbInvoices[0].total_amount -
                      dbInvoices[0].discount -
                      totalPaid >
                    0
                  ) {
                    isPaid = false;
                  } else {
                    isPaid = true;
                  }
                  db.Invoice.update(
                    { amount_paid: totalPaid, paid: isPaid },
                    { where: { id: invoiceId } }
                  ).then(function(dbInvoice) {
                    console.log(dbInvoice); //called never used why even have the parameters in the ufnciotn?
                    res.json(dbPayment);
                  });
                });
              }
            );
          });
        });
      }
    });

    // Delete a payment by id
    app.delete("/api/payments/:id", function(req, res) {
      db.Payment.findAll({ where: { id: req.params.id } }).then(function(
        dbPayment
      ) {
        // after deleting a payment, we have to reevaluate how much has been paid toward an invoice and whether it has been paid in full
        const invoiceId = dbPayment[0].invoice_id;
        db.Payment.destroy({ where: { id: req.params.id } }).then(function(
          dbPayment
        ) {
          db.Payment.findAll({ where: { invoice_id: invoiceId } }).then(
            function(dbPayments) {
              let totalPaid = 0;
              for (let i = 0; i < dbPayments.length; i++) {
                const amount = parseFloat(dbPayments[i].amount);
                totalPaid = totalPaid + amount;
              }
              db.Invoice.findAll({ where: { id: invoiceId } }).then(function(
                dbInvoices
              ) {
                let isPaid;
                if (
                  dbInvoices[0].total_amount - req.body.discount - totalPaid >
                  0
                ) {
                  isPaid = false;
                } else {
                  isPaid = true;
                }
                db.Invoice.update(
                  { amount_paid: totalPaid, paid: isPaid },
                  { where: { id: invoiceId } }
                ).then(function(dbInvoice) {
                  console.log(dbInvoice); //why need to refactor this whole file just saying
                  res.json(dbPayment);
                });
              });
            }
          );
        });
      });
    });
  },
};