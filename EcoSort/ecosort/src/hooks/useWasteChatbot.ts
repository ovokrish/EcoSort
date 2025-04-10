
import { useState } from 'react';

export type Message = {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
};

// Create a comprehensive waste management knowledge base
const wasteKnowledgeBase = {
  // Plastics
  'plastic bottle': 'Plastic bottles should be emptied, rinsed, and placed in the recycling bin. Remember to remove the cap and recycle it separately as they\'re often made from different types of plastic.',
  'plastic bag': 'Most curbside recycling programs don\'t accept plastic bags. Take them to grocery stores with plastic film recycling bins. Better yet, use reusable bags!',
  'plastic wrap': 'Plastic wrap or cling film is typically not recyclable in curbside programs. Dispose of it in regular trash or look for special plastic film recycling programs.',
  'styrofoam': 'Styrofoam (expanded polystyrene) is difficult to recycle. Most municipalities require it to go in the trash. Check for specialized recycling facilities in your area.',
  'plastic straw': 'Plastic straws are usually not recyclable due to their small size and typically end up in landfills or as pollution. Consider using reusable metal, glass, or bamboo straws.',
  'plastic utensils': 'Plastic cutlery is rarely accepted in recycling programs due to its small size and mixed materials. If possible, use reusable utensils or choose compostable alternatives.',
  
  // Paper
  'newspaper': 'Newspapers are highly recyclable. Keep them clean and dry, then place in paper recycling. Some communities may ask you to bundle them separately.',
  'cardboard': 'Flatten cardboard boxes to save space. Remove any tape, plastic, or styrofoam before recycling. Soiled cardboard (like greasy pizza boxes) should go in compost, not recycling.',
  'magazine': 'Glossy magazines are recyclable, but remove any plastic wrapping first. Some specialty coatings may reduce recyclability.',
  'receipts': 'Thermal paper receipts (shiny, slick paper) contain BPA and should go in the trash, not recycling. Regular paper receipts can be recycled.',
  'shredded paper': 'Put shredded paper in a paper bag before recycling to prevent it from becoming confetti throughout the recycling facility. Some programs may not accept it.',
  
  // Glass
  'glass bottle': 'Rinse glass bottles and recycle without caps. Different colors of glass may need to be separated depending on your local program.',
  'glass jar': 'Remove lids and rinse jars before recycling. Metal lids can typically be recycled separately. Glass is infinitely recyclable without loss of quality.',
  'mirror': 'Mirrors cannot be recycled with container glass as they have different melting points and chemical compositions. Donate usable mirrors or dispose of broken ones in the trash.',
  'drinking glass': 'Drinking glasses, window glass, and ceramics are not recyclable with container glass and can contaminate the recycling stream. Donate usable items or dispose of broken ones safely.',
  
  // Metal
  'aluminum can': 'Rinse aluminum cans and recycle them—no need to remove labels. Aluminum is infinitely recyclable and doing so saves 95% of the energy needed to produce new aluminum.',
  'tin can': 'Rinse food residue from tin cans and place in recycling. You can leave labels on, and in most programs, you can leave the lid partially attached.',
  'aluminum foil': 'Clean aluminum foil can be recycled, but it must be free of food residue. Ball it up to form a larger piece so it doesn\'t get lost in the recycling process.',
  'aerosol can': 'Empty aerosol cans can typically be recycled with other metals, but they must be completely empty. Never puncture or flatten aerosol cans.',
  
  // E-waste
  'battery': 'Never put batteries in regular trash or recycling. Take them to designated battery recycling locations, as they can cause fires in waste facilities. Many electronics stores offer battery recycling.',
  'phone': 'Cell phones contain valuable materials and hazardous components. Many electronics retailers offer take-back programs, or you can donate working phones to charitable organizations.',
  'computer': 'Computers contain valuable metals and hazardous materials. Use manufacturer take-back programs, donate working computers, or take to e-waste collection events.',
  'television': 'TVs contain lead and other hazardous materials. Many retailers offer recycling when you purchase a new TV, or you can use municipal e-waste collection services.',
  'printer cartridge': 'Many printer cartridges can be refilled and reused. Office supply stores often have recycling programs with incentives for returning used cartridges.',
  
  // Organic Waste
  'food scraps': 'Food scraps are ideal for composting. If you don\'t have a home compost, check if your community offers food waste collection or compost drop-off locations.',
  'yard waste': 'Grass clippings, leaves, and small branches can be composted at home or through municipal yard waste collection. Some communities prohibit yard waste in landfills.',
  'coffee grounds': 'Coffee grounds are excellent for composting and add nitrogen to your compost pile. You can also use them directly in garden soil as a fertilizer.',
  'meat waste': 'Meat, bones, and dairy should not go in home composting systems as they can attract pests and create odors. Some municipal composting systems can handle these items.',
  
  // Hazardous Waste
  'paint': 'Never pour paint down drains or place in regular trash. Water-based paint can often be dried out and disposed of in trash, but check for local paint recycling programs first.',
  'cleaning products': 'Use up cleaning products completely or give them to someone who can use them. Never pour down drains. Take hazardous cleaning products to household hazardous waste collection.',
  'medication': 'Never flush medications down the toilet. Use pharmacy take-back programs or community drug take-back events. Some medications can be disposed of in household trash if mixed with coffee grounds or cat litter.',
  'fluorescent bulb': 'Fluorescent bulbs and CFLs contain mercury and should be taken to hazardous waste collection or retailers that accept them for recycling. LED bulbs are more environmentally friendly alternatives.',
  'motor oil': 'Used motor oil is highly recyclable. Many auto parts stores and service centers accept used oil for recycling. Never pour it down drains or on the ground.',
  
  // Special Items
  'clothing': 'Donate wearable clothing to thrift stores or textile recycling. Even worn or damaged textiles can be recycled into insulation or rags.',
  'shoes': 'Donate usable shoes to charities or collection programs. Some athletic shoe companies have recycling programs for worn-out sneakers.',
  'mattress': 'Mattresses are difficult to recycle but many communities have specialized recycling programs. Some retailers offer mattress recycling when you purchase a new one.',
  'furniture': 'Try to donate or sell usable furniture. For broken items, check if your community has bulky waste pickup or if the materials can be separated for recycling.',
  'tires': 'Tires should never go in regular trash. Many tire retailers will recycle your old tires (often for a small fee) when you purchase new ones.',
  
  // General Recycling Concepts
  'contamination': 'Contamination occurs when non-recyclable items are placed in recycling bins or when recyclables contain food residue. This can cause entire batches of recycling to be rejected and sent to landfill.',
  'wishcycling': 'Wishcycling is putting something in the recycling bin hoping it can be recycled, even when you\'re unsure. This good intention actually causes problems by contaminating recycling streams.',
  'compost': 'Composting is the natural process of recycling organic material into nutrient-rich soil amendment. Home composting can divert up to 30% of household waste from landfills.',
  'zero waste': 'Zero waste is a philosophy focused on waste prevention. It encourages redesigning resource lifecycles so all products are reused, with no trash sent to landfills or incinerators.',
  'biodegradable': 'Biodegradable means a material can break down naturally, but doesn\'t specify timeframe or conditions required. Not all biodegradable items are compostable in home systems.',
  'microplastics': 'Microplastics are tiny plastic particles under 5mm that result from plastic breakdown or are manufactured at that size. They\'re found throughout the environment and food chain.',
};

export const useWasteChatbot = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm your EcoGuide waste management expert. Ask me how to properly dispose of any waste item, and I'll provide detailed environmental guidance.",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = (text: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    
    // Generate response with enhanced knowledge
    setTimeout(() => {
      const botResponse = generateBotResponse(text);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const generateBotResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    // Check our comprehensive knowledge base first
    for (const [keyword, response] of Object.entries(wasteKnowledgeBase)) {
      if (input.includes(keyword)) {
        return response;
      }
    }
    
    // Check for specific waste categories
    if (containsAny(input, ['plastic', 'bottle', 'container', 'packaging'])) {
      return "For plastic waste: Rinse containers, check for recycling symbols (1-7) at the bottom. Most curbside programs accept #1 (PET) and #2 (HDPE) plastics. Remove caps if required by your local program. Plastic bags and film typically need to be returned to grocery store collection points, not placed in curbside recycling.";
    }
    
    if (containsAny(input, ['paper', 'cardboard', 'newspaper', 'mail', 'magazine'])) {
      return "Paper products should be clean and dry for recycling. Flatten cardboard boxes. Shredded paper should be contained in a paper bag. Remove plastic windows from envelopes and plastic covers from magazines. Soiled paper products with food waste should be composted or thrown away, not recycled.";
    }
    
    if (containsAny(input, ['glass', 'bottle', 'jar'])) {
      return "Glass bottles and jars should be emptied, rinsed, and recycled. Remove caps and lids (these can often be recycled separately). Note that other glass items like drinking glasses, windows, mirrors, and ceramics are NOT recyclable with container glass and can contaminate the recycling stream.";
    }
    
    if (containsAny(input, ['metal', 'aluminum', 'can', 'tin', 'foil'])) {
      return "Clean metal cans, aluminum foil, and trays can be recycled. Rinse food residue first. Aluminum cans are infinitely recyclable and save 95% of the energy needed to produce new aluminum. For aluminum foil, ball it up to form a larger piece so it doesn't get lost in sorting machinery.";
    }
    
    if (containsAny(input, ['food', 'organic', 'compost', 'vegetable', 'fruit', 'yard', 'leaves'])) {
      return "Organic waste like food scraps and yard trimmings should be composted. Home composting works well for fruit/vegetable scraps, coffee grounds, egg shells, yard waste, and uncoated paper. Municipal composting programs may accept meat, dairy, and bones, which should not go in home compost systems. Food waste in landfills produces methane, a potent greenhouse gas.";
    }
    
    if (containsAny(input, ['electronic', 'e-waste', 'battery', 'computer', 'phone', 'tv', 'appliance'])) {
      return "E-waste contains both hazardous materials and valuable resources. Never dispose of electronics or batteries in regular trash. Use manufacturer take-back programs, municipal e-waste collection events, or certified e-waste recyclers. Many electronics retailers also offer recycling programs. Data should be wiped from devices before recycling.";
    }
    
    if (containsAny(input, ['hazardous', 'paint', 'chemical', 'oil', 'medication', 'prescription', 'bulb', 'fluorescent'])) {
      return "Hazardous waste requires special handling. Never pour chemicals down drains or place in regular trash. Look for household hazardous waste collection events in your community. Some items like medications can be returned to pharmacies, and items like paint and motor oil are often accepted at the businesses that sell them.";
    }
    
    if (containsAny(input, ['textile', 'clothing', 'fabric', 'shoes', 'apparel'])) {
      return "Donate wearable clothing and textiles to thrift stores or charity organizations. Many communities have textile recycling programs for worn or damaged items too. Some clothing retailers offer take-back programs. Textiles should never go in regular recycling bins as they can tangle in sorting machinery.";
    }
    
    // Check for common questions
    if (containsAny(input, ['recycle', 'what can', 'how to'])) {
      return "Recyclable materials typically include: clean paper and cardboard, glass bottles and jars, metal cans, and certain plastics (usually #1 and #2). Always check your local recycling guidelines as they vary by location. Items should be empty, clean, and dry. Keep recyclables loose, not bagged. When in doubt, it's better to throw it out than contaminate the recycling stream.";
    }
    
    if (containsAny(input, ['zero waste', 'reduce', 'minimize'])) {
      return "To reduce waste: 1) Refuse what you don't need, 2) Reduce what you consume, 3) Reuse items instead of disposables, 4) Repair before replacing, 5) Recycle properly, 6) Rot (compost) organic waste. Start with simple swaps like reusable bags, water bottles, and coffee cups. Buy in bulk to reduce packaging. Consider the lifecycle of products before purchasing.";
    }
    
    if (containsAny(input, ['compost', 'composting', 'food waste'])) {
      return "Composting basics: Mix 'greens' (nitrogen-rich materials like food scraps, coffee grounds, and fresh yard waste) with 'browns' (carbon-rich materials like dried leaves, paper, and cardboard) in roughly equal amounts. Keep the pile moist but not soggy. Turn it regularly to provide oxygen. Avoid meat, dairy, oils, pet waste, and diseased plants in home compost.";
    }
    
    // Generic responses
    if (containsAny(input, ['hello', 'hi', 'hey', 'start'])) {
      return "Hello! I'm your waste management assistant. You can ask me how to dispose of specific items, learn about recycling guidelines, composting tips, or how to reduce your waste footprint. What would you like to know about today?";
    }
    
    if (containsAny(input, ['thank', 'thanks'])) {
      return "You're welcome! Every small action to properly manage waste makes a difference for our planet. Is there anything else you'd like to know about waste disposal or recycling?";
    }
    
    // Default response
    return "I don't have specific information about that item, but here are some general guidelines: 1) Check your local waste management website for specific rules in your area, 2) Look for recycling symbols or codes on the item, 3) When in doubt, it's usually better to place questionable items in the trash rather than risk contaminating recycling streams. Can you tell me more specifically what you're trying to dispose of?";
  };

  const containsAny = (text: string, keywords: string[]): boolean => {
    return keywords.some(keyword => text.includes(keyword));
  };

  return {
    messages,
    isTyping,
    sendMessage
  };
};
